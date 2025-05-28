# df_utils_signals.py

import sys
import asyncio # For potential async wrapping if vision client methods are sync
from typing import List, Dict, Optional, Tuple, Any

import numpy as np
# from google.cloud import vision # Imported in notebook, client passed in

# Eye Blink Detection (Google Cloud Vision API)

def _get_landmark_pos_from_list(
    landmarks_from_vision_api: List[Dict[str, Any]],
    target_landmark_type_name: str
) -> Optional[Tuple[float, float]]:
    """Helper to find a specific landmark by its type name from a list of landmark dicts."""
    for landmark in landmarks_from_vision_api:
        if landmark.get('type') == target_landmark_type_name:
            # Vision API returns normalized x, y (0.0 to 1.0)
            return (landmark.get('x', 0.0), landmark.get('y', 0.0))
    return None

def _get_all_landmarks_of_type(
    landmarks_from_vision_api: List[Dict[str, Any]],
    target_landmark_type_name: str
) -> List[Tuple[float, float]]:
    """Helper to get all landmark positions of a specific type (e.g., for contours)."""
    points = []
    for landmark in landmarks_from_vision_api:
        if landmark.get('type') == target_landmark_type_name:
            points.append((landmark.get('x', 0.0), landmark.get('y', 0.0)))
    return points

def _distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """Calculates Euclidean distance between two 2D points."""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def _calculate_ear_for_eye(
    p1: Optional[Tuple[float, float]], p2: Optional[Tuple[float, float]],
    p3: Optional[Tuple[float, float]], p4: Optional[Tuple[float, float]],
    p5: Optional[Tuple[float, float]], p6: Optional[Tuple[float, float]]
) -> float:
    """
    Calculates Eye Aspect Ratio given 6 landmark points (x,y tuples).
    Returns a default EAR (e.g., 0.35, indicating an open eye) if essential points are missing.
    P1, P4: Eye corners (horizontal)
    P2, P3: Upper eyelid points
    P5, P6: Lower eyelid points
    EAR = (|P2-P6| + |P3-P5|) / (2 * |P1-P4|)
    """
    if not all([p1, p2, p3, p4, p5, p6]):
        return 0.35 # Default for open eye if key landmarks are missing

    # Vertical distances
    d_p2_p6 = _distance(p2, p6)
    d_p3_p5 = _distance(p3, p5)
    # Horizontal distance
    d_p1_p4 = _distance(p1, p4)
    
    if d_p1_p4 < 1e-7: # Avoid division by zero or very small width (effectively closed or error)
        return 0.05 # Return a very small EAR indicating closed eye
        
    ear_val = (d_p2_p6 + d_p3_p5) / (2.0 * d_p1_p4)
    return ear_val

def _find_closest_point_on_contour(
    contour_points: List[Tuple[float, float]],
    target_x: float,
    prefer_min_y_for_upper: Optional[bool] = None # True for upper, False for lower, None if no preference
) -> Optional[Tuple[float, float]]:
    """
    Finds the point on a contour closest to a target x-coordinate.
    If prefer_min_y_for_upper is True, prefers smallest y for upper eyelid (highest point).
    If prefer_min_y_for_upper is False, prefers largest y for lower eyelid (lowest point).
    """
    if not contour_points:
        return None
    
    best_point = None
    min_dist_sq = float('inf')

    for point in contour_points:
        dist_sq = (point[0] - target_x)**2 # Prioritize x-distance
        
        if prefer_min_y_for_upper is True: # For upper eyelid, seek smallest y if x is similar
            if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                best_point = point
            elif dist_sq == min_dist_sq: # If x-distances are same, prefer smaller y
                if best_point is None or point[1] < best_point[1]:
                    best_point = point
        elif prefer_min_y_for_upper is False: # For lower eyelid, seek largest y if x is similar
             if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                best_point = point
             elif dist_sq == min_dist_sq: # If x-distances are same, prefer larger y
                if best_point is None or point[1] > best_point[1]:
                    best_point = point
        else: # No y-preference, just closest x
            if dist_sq < min_dist_sq:
                min_dist_sq = dist_sq
                best_point = point
                
    return best_point


def _extract_ear_points_for_one_eye(
    face_landmarks: List[Dict[str, Any]], 
    eye_prefix: str # "LEFT" or "RIGHT"
) -> Optional[Tuple[Tuple[float,float], ...]]:
    """
    Extracts the 6 P-points for EAR calculation for a single eye (LEFT or RIGHT)
    from the full list of Vision API landmarks for a face.
    """
    # P1: Inner corner, P4: Outer corner
    if eye_prefix == "LEFT":
        p1 = _get_landmark_pos_from_list(face_landmarks, "LEFT_EYE_RIGHT_CORNER")  # Medial
        p4 = _get_landmark_pos_from_list(face_landmarks, "LEFT_EYE_LEFT_CORNER")   # Lateral
        upper_boundary_points = _get_all_landmarks_of_type(face_landmarks, "LEFT_EYE_TOP_BOUNDARY")
        lower_boundary_points = _get_all_landmarks_of_type(face_landmarks, "LEFT_EYE_BOTTOM_BOUNDARY")
    elif eye_prefix == "RIGHT":
        p1 = _get_landmark_pos_from_list(face_landmarks, "RIGHT_EYE_LEFT_CORNER")  # Medial
        p4 = _get_landmark_pos_from_list(face_landmarks, "RIGHT_EYE_RIGHT_CORNER")  # Lateral
        upper_boundary_points = _get_all_landmarks_of_type(face_landmarks, "RIGHT_EYE_TOP_BOUNDARY")
        lower_boundary_points = _get_all_landmarks_of_type(face_landmarks, "RIGHT_EYE_BOTTOM_BOUNDARY")
    else:
        return None

    if not p1 or not p4 or not upper_boundary_points or not lower_boundary_points:
        # print(f"Warning: Missing corner or boundary landmarks for {eye_prefix}_EYE.", file=sys.stderr)
        return None

    # Define reference x-coordinates based on eye corners
    # Ensure min_x_corner is truly the smaller x, and max_x_corner is larger for span calculation
    min_x_corner = min(p1[0], p4[0])
    max_x_corner = max(p1[0], p4[0])
    eye_width = max_x_corner - min_x_corner

    if eye_width < 1e-6 : # Eye corners are too close, likely an error or closed eye
        return None

    # x-coordinates for selecting P2/P6 and P3/P5 (at 25% and 75% of eye width)
    x_ref1 = min_x_corner + 0.25 * eye_width
    x_ref2 = min_x_corner + 0.75 * eye_width

    # P2: Point on UPPER_BOUNDARY closest to x_ref1 (preferring smaller y)
    p2 = _find_closest_point_on_contour(upper_boundary_points, x_ref1, prefer_min_y_for_upper=True)
    # P3: Point on UPPER_BOUNDARY closest to x_ref2 (preferring smaller y)
    p3 = _find_closest_point_on_contour(upper_boundary_points, x_ref2, prefer_min_y_for_upper=True)
    
    # P6: Point on LOWER_BOUNDARY closest to x_ref1 (preferring larger y)
    p6 = _find_closest_point_on_contour(lower_boundary_points, x_ref1, prefer_min_y_for_upper=False)
    # P5: Point on LOWER_BOUNDARY closest to x_ref2 (preferring larger y)
    p5 = _find_closest_point_on_contour(lower_boundary_points, x_ref2, prefer_min_y_for_upper=False)

    if not all([p2, p3, p5, p6]):
        # print(f"Warning: Could not determine all P2,P3,P5,P6 for {eye_prefix}_EYE.", file=sys.stderr)
        return None
        
    return p1, p2, p3, p4, p5, p6


async def get_eye_landmarks_from_vision_api(
    image_bytes_list: List[bytes],
    vision_client # Initialized google.cloud.vision.ImageAnnotatorClient
) -> List[Optional[List[Dict[str, Any]]]]:
    """
    Sends images to Google Cloud Vision API for face detection and extracts all landmarks.
    Returns a list (one entry per image); each entry is a list of faces (usually 1);
    each face is a list of its landmark dicts {'type': type_name, 'x': x, 'y': y, 'z': z}.
    Returns None for a frame's face list if an error occurs or no faces/landmarks are found.
    """
    from google.cloud import vision_v1 as vision
    
    if not image_bytes_list:
        return []

    requests = []
    for img_bytes in image_bytes_list:
        image = vision.Image(content=img_bytes)
        features = [vision.Feature(type_=vision.Feature.Type.FACE_DETECTION, max_results=1)]
        requests.append(vision.AnnotateImageRequest(image=image, features=features))

    all_frames_parsed_landmarks: List[Optional[List[List[Dict[str, Any]]]]] = []
    try:
        # Create a BatchAnnotateImagesRequest object
        batch_request = vision.BatchAnnotateImagesRequest(requests=requests)
        
        # Since vision_client.batch_annotate_images is synchronous, 
        # we'll run it in a thread executor to avoid blocking the event loop
        loop = asyncio.get_running_loop()
        response_batch = await loop.run_in_executor(
            None, 
            vision_client.batch_annotate_images, 
            batch_request
        )

        for i, response in enumerate(response_batch.responses):
            if response.error.message:
                print(f"Vision API error for image {i}: {response.error.message}", file=sys.stderr)
                all_frames_parsed_landmarks.append(None)
                continue

            frame_faces_data = []
            for face_annotation in response.face_annotations:
                # Check face detection confidence if needed
                # if face_annotation.detection_confidence < 0.7: continue

                single_face_landmarks = []
                for landmark in face_annotation.landmarks:
                    single_face_landmarks.append({
                        "type": landmark.type_.name, 
                        "x": landmark.position.x,
                        "y": landmark.position.y,
                        "z": landmark.position.z,
                    })
                if single_face_landmarks:
                    frame_faces_data.append(single_face_landmarks)
            
            all_frames_parsed_landmarks.append(frame_faces_data if frame_faces_data else None)
            
    except Exception as e:
        print(f"Error calling Google Cloud Vision API or processing results: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        all_frames_parsed_landmarks = [None] * len(image_bytes_list)
        
    return all_frames_parsed_landmarks


def calculate_blink_score_from_vision_api(
    all_frames_face_annotations: List[Optional[List[List[Dict[str, Any]]]]], 
    video_segment_duration_sec: float,
    # effective_fps_for_vision_api: float # Not strictly needed if we use segment duration
) -> float:
    """
    Calculates a blink score based on Eye Aspect Ratio (EAR) from Vision API landmarks.
    all_frames_face_annotations: List (per frame) of Lists (per face) of Landmark Dictionaries.
    """
    if not all_frames_face_annotations or video_segment_duration_sec <= 0:
        print("Warning: No landmark data or zero duration for blink calculation.", file=sys.stderr)
        return 0.5 # Neutral score (uncertain)

    blink_count = 0
    # EAR threshold for considering an eye closed. This is highly dependent on the EAR calculation
    # and landmark quality. Needs tuning based on normalized coordinates.
    ear_threshold = 0.20 
    consecutive_frames_for_blink = 2 # Number of consecutive frames EAR must be low
    
    low_ear_counter = 0
    is_currently_blinking_state = False 

    num_frames_with_valid_ear = 0

    for frame_face_list in all_frames_face_annotations:
        # If frame_face_list is None (API error for frame) or empty (no faces detected)
        if not frame_face_list or not frame_face_list[0]: 
            if is_currently_blinking_state: 
                is_currently_blinking_state = False 
            low_ear_counter = 0
            continue
        
        primary_face_landmarks = frame_face_list[0] # Use landmarks of the first detected face

        left_ear_points = _extract_ear_points_for_one_eye(primary_face_landmarks, "LEFT")
        right_ear_points = _extract_ear_points_for_one_eye(primary_face_landmarks, "RIGHT")

        ear_left = _calculate_ear_for_eye(*left_ear_points) if left_ear_points else None
        ear_right = _calculate_ear_for_eye(*right_ear_points) if right_ear_points else None
        
        avg_ear = None
        if ear_left is not None and ear_right is not None:
            avg_ear = (ear_left + ear_right) / 2.0
        elif ear_left is not None:
            avg_ear = ear_left
        elif ear_right is not None:
            avg_ear = ear_right
        
        if avg_ear is None: # Could not calculate EAR for this frame
            if is_currently_blinking_state:
                is_currently_blinking_state = False
            low_ear_counter = 0
            continue 
        
        num_frames_with_valid_ear +=1

        # Blink detection state machine
        if avg_ear < ear_threshold:
            low_ear_counter += 1
        else: # Eyes are open (EAR >= threshold)
            if low_ear_counter >= consecutive_frames_for_blink: 
                blink_count += 1
            low_ear_counter = 0 
        
        is_currently_blinking_state = (low_ear_counter >= consecutive_frames_for_blink)

    # If the segment ends while eyes are still considered closed, count it as a final blink
    if low_ear_counter >= consecutive_frames_for_blink:
        blink_count += 1
        
    blinks_per_minute = 0
    # Use video_segment_duration_sec, which is the duration of the video portion
    # from which these frames were taken.
    if video_segment_duration_sec > 0:
        blinks_per_minute = (blink_count / video_segment_duration_sec) * 60
    
    print(f"Vision API Blinks: Count={blink_count}, Segment Duration Analyzed={video_segment_duration_sec:.2f}s, Approx BPM={blinks_per_minute:.2f}", file=sys.stderr)

    # Scoring based on deviation from a typical blink rate range (e.g., 8-25 BPM)
    # Score: 0.9 (normal), 0.5 (borderline/uncertain), 0.1 (unusual)
    if blinks_per_minute < 5 or blinks_per_minute > 35: return 0.1 
    elif (5 <= blinks_per_minute < 8) or (25 < blinks_per_minute <= 35): return 0.5 
    elif 8 <= blinks_per_minute <= 25: return 0.9
    else: return 0.5 # Default for edge cases or if blink_count is 0 but duration is also 0