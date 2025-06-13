import requests
import time
import os
import json

BASE_URL = "http://localhost:8000/api"
TEST_USER_EMAIL = "test2@example.com"
TEST_USER_PASSWORD = "password123"

def get_auth_token(email, password):
    """
    Logs in a user and returns the auth token.
    If the user doesn't exist, it signs them up first.
    """
    login_url = f"{BASE_URL}/auth/login"
    signup_url = f"{BASE_URL}/auth/signup"
    
    # 1. Try to log in first
    login_data = {'username': email, 'password': password}
    response = requests.post(login_url, data=login_data)
    
    # 2. If login fails (user might not exist), sign up
    if response.status_code != 200:
        print("Login failed, attempting to sign up user...")
        signup_data = {'email': email, 'password': password}
        signup_response = requests.post(signup_url, json=signup_data)
        
        if signup_response.status_code != 200:
            # If signup fails for a reason other than "already exists", raise an error.
            if "already registered" not in signup_response.text:
                 raise Exception(f"Signup failed: {signup_response.text}")
            print("User already exists, proceeding with login.")
        else:
            print("✅ User signed up successfully.")

        # 3. Log in again after successful signup or if user already existed
        response = requests.post(login_url, data=login_data)
        if response.status_code != 200:
            raise Exception(f"Login failed after signup attempt: {response.text}")

    print("✅ Successfully logged in.")
    return response.json()['access_token']


def analyze_video(video_path: str, token: str):
    # 1. Upload video and get job_id
    url = f"{BASE_URL}/analyze"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nUploading video: {os.path.basename(video_path)}")
    with open(video_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Upload failed: {response.text}")
    
    job_id = response.json()['job_id']
    print(f"✅ Job submitted. ID: {job_id}")
    
    # 2. Poll status until complete
    print("\nWaiting for analysis to complete...")
    while True:
        status_response = requests.get(f"{BASE_URL}/status/{job_id}")
        status_data = status_response.json()
        
        if status_data['status'] == 'completed':
            break
        elif status_data['status'] == 'failed':
            raise Exception(f"Job failed: {status_data.get('error', 'Unknown error')}")
        
        print(f"Status: {status_data['status']}, Progress: {status_data['progress']}")
        time.sleep(2)  # Wait 2 seconds before next check
    
    # 3. Get results
    print("\nFetching results...")
    result_response = requests.get(f"{BASE_URL}/result/{job_id}")
    return result_response.json()

if __name__ == "__main__":
    # Path to the test video
    video_path = "../videos_for_testing/fake_la.mp4"

    try:
        # Get auth token
        auth_token = get_auth_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        
        # Analyze video with token
        result_data = analyze_video(video_path, auth_token)

        # --- Full API Response for Frontend ---
        print("\n--- Full API Response (for Frontend) ---")
        print(json.dumps(result_data, indent=2))
        print("----------------------------------------\n")
        
        print("\n📊 Formatted Summary:")
        
        # Top-level result fields
        final_result = result_data['result']
        print(f"🔍 Is Real: {final_result['isReal']}")
        print(f"📈 Confidence: {final_result['confidenceScore']:.2%}")
        print(f"🏷️  Label: {final_result['label']}")
        print(f"📝 Tags: {(', '.join(final_result['tags']) if final_result['tags'] else 'None')}")
        print(f"⏱️  Processing Time: {result_data.get('processing_time', 0.0):.1f} seconds")
        
        # Detailed results
        details = final_result['details']
        print("\n🔎 Detailed Results:")
        print(f"  • Video Processed Length: {details['videoLength']:.1f}s")
        print(f"  • Original Video Length: {details['originalVideoLength']:.1f}s")
        print(f"  • Transcript Snippet: {details.get('transcriptSnippet', 'N/A')}")
        print(f"  • Pipeline Version: {details.get('pipelineVersion', 'unknown')}")

        # Gemini Flags
        gemini_checks = details.get('geminiChecks', {})
        print("\n  🔬 Gemini Flag Checks:")
        print(f"    • Visual Artifacts: {'✅ DETECTED' if gemini_checks.get('visualArtifacts') else '❌'}")
        print(f"    • Lip-sync Issue:   {'✅ DETECTED' if gemini_checks.get('lipsyncIssue') else '❌'}")
        print(f"    • Abnormal Blinks:  {'✅ DETECTED' if gemini_checks.get('abnormalBlinks') else '❌'}")

        # Heuristic Checks (Scores)
        heuristic_checks = details.get('heuristicChecks', {})
        print("\n  🌡️  Component Scores (0.0 = Likely Real, 1.0 = Likely Fake):")
        if heuristic_checks:
            # Manually print in a more logical order
            score_map = {
                "visual_clip": "Visual (CLIP)",
                "gemini_visual_artifacts": "Visual (Gemini Artifacts Flag)",
                "gemini_lipsync_issue": "Sync (Gemini Lipsync Flag)",
                "gemini_blink_abnormality": "Visual (Gemini Blinks Flag)",
                "gibberish": "Text (Gibberish Check)",
                "flow": "Visual (Motion Flow)",
                "audio": "Audio (Looping)",
                "video_ai": "Visual (Shot Changes)"
            }
            for key, name in score_map.items():
                if key in heuristic_checks:
                    score = heuristic_checks[key]
                    print(f"    • {name:<30}: {score:.3f}")
        else:
            print("    • No heuristic scores reported.")

        # Timeline Events
        events = final_result.get('events', [])
        print("\n  🕒 Timeline Events:")
        if events:
            for i, event in enumerate(events):
                print(f"    event {i+1}:")
                print(f"      → Module: {event.get('module')}")
                print(f"      → Event Type: {event.get('event')}")
                print(f"      → Timestamp (ts): {event.get('ts'):.2f}s")
                print(f"      → Duration (dur): {event.get('dur'):.2f}s")
                print(f"      → Metadata: {event.get('meta')}")
        else:
            print("    • No timeline events reported.")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        print(traceback.format_exc()) 