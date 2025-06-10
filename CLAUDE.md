# FakeCheck: AI-Powered Deepfake Detection Platform

This document provides a comprehensive overview of the FakeCheck project, a full-stack application designed to detect AI-generated and deepfaked videos.

## 1. Project Overview

FakeCheck is a web-based tool that allows users to upload a video file for analysis. A sophisticated backend pipeline processes the video through multiple AI models and heuristic checks to determine its authenticity. The results are then presented to the user in a detailed, easy-to-understand report on the frontend.

**Core Features:**
-   **Full-Stack Application:** A React/TypeScript frontend and a Python/FastAPI backend.
-   **Asynchronous Job Processing:** Handles video analysis in the background without blocking the user interface.
-   **Multi-Layered Detection Pipeline:** Combines several state-of-the-art models and algorithms for robust detection.
-   **Detailed Analysis Report:** Provides an overall score, confidence level, and a breakdown of individual checks.
-   **Interactive Timeline:** Pinpoints specific moments in the video where potential anomalies were detected.

---

## 2. Technology Stack

### Backend
-   **Framework:** FastAPI
-   **Language:** Python 3
-   **Async:** Uvicorn
-   **Data Validation:** Pydantic
-   **AI / Machine Learning:**
    -   PyTorch
    -   Google Gemini (`gemini-2.5-pro-preview-05-06`)
    -   OpenAI Whisper (`base` model)
    -   OpenCLIP (`ViT-L-14`)
-   **Core Libraries:** `opencv-python`, `ffmpeg-python`

### Frontend
-   **Framework:** React 18
-   **Language:** TypeScript
-   **Build Tool:** Vite
-   **Styling:** Tailwind CSS
-   **UI Components:** Custom components, `lucide-react` for icons.
-   **Animation:** Framer Motion

---

## 3. Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── core/               # Core detection modules (models, gemini, audio, flow, etc.)
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration (API keys, model names)
│   │   ├── dependencies.py     # Model loading and caching
│   │   ├── main.py             # FastAPI app, API endpoints, background tasks
│   │   ├── pipeline.py         # Main analysis pipeline orchestration
│   │   └── schemas.py          # Pydantic models for API request/response
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # React UI components
│   │   ├── hooks/              # Custom React hooks (useVideoDetection.ts)
│   │   ├── lib/                # Utility functions
│   │   ├── services/           # API interaction layer (api.ts)
│   │   ├── types/              # TypeScript type definitions (index.ts)
│   │   ├── App.tsx             # Main application component
│   │   ├── main.tsx            # Application entry point
│   │   └── index.css           # Global styles and Tailwind directives
│   └── ...
└── CLAUDE.md                   # This file
```

---

## 4. Backend Architecture

The backend is a FastAPI application that exposes a REST API for video analysis. It uses a job-based system to handle potentially long-running analysis tasks asynchronously.

### API Endpoints (`main.py`)

-   `POST /api/analyze`:
    -   Accepts a video file upload.
    -   Creates a unique `job_id`.
    -   Saves the video to a temporary location.
    -   Schedules a background task (`process_video_background`) to run the analysis pipeline.
    -   Immediately returns the `job_id` to the client.
-   `GET /api/status/{job_id}`:
    -   Allows the client to poll for the status of a job (`pending`, `processing`, `completed`, `failed`).
-   `GET /api/result/{job_id}`:
    -   Once the job is `completed`, this endpoint returns the detailed analysis results.

### Core Detection Pipeline (`pipeline.py`)

This is the heart of the backend. The `run_detection_pipeline` function orchestrates the analysis in a specific sequence:

1.  **Video Pre-processing (`core/video.py`):** The input video is sampled to a standard `TARGET_FPS` (8 fps) and a maximum duration. The audio track is extracted and saved temporarily.
2.  **CLIP Visual Score:** A CLIP model (`ViT-L-14`) analyzes the video frames to generate a "visual realness" score, which checks for stylistic coherence.
3.  **Whisper Audio Transcription:** The extracted audio is transcribed by OpenAI's Whisper model. This transcript is used for lip-sync analysis and checking for generated text patterns.
4.  **Gemini Multi-Modal Inspections (`core/gemini.py`):** A powerful multi-modal model (Gemini Pro) is prompted to check for:
    -   **Visual Artifacts:** Looks for common signs of AI generation like weird textures, blended objects, etc.
    -   **Lip-sync Issues:** Compares the visual lip movement to the audio transcript.
    -   **Blinking Patterns:** Analyzes eye blinking for unnatural regularity or absence.
    -   **OCR & Gibberish Text:** Performs Optical Character Recognition (OCR) on frames and checks for nonsensical or "gibberish" text.
5.  **Heuristic Detectors:**
    -   **Motion Flow (`core/flow.py`):** Uses optical flow to detect unnatural spikes or inconsistencies in movement between frames.
    -   **Audio Analysis (`core/audio.py`):** Checks the audio for looping patterns or tell-tale signs of AI voice generation.
    -   **Lighting Analysis (`core/video.py`):** Detects sudden, physically improbable changes in lighting, a common artifact in stitched-together videos.
6.  **Score Fusion (`core/fusion.py`):** All the scores, flags, and outputs from the previous steps are fed into a fusion model. This model weighs the different signals to produce a final prediction (`LIKELY_REAL`, `UNCERTAIN`, `LIKELY_FAKE`) and an overall confidence score.
7.  **Event Aggregation:** All modules can emit timestamped `AnomalyEvent` objects. These are collected, sorted, and included in the final result, allowing the frontend to pinpoint exactly *when* and *what* was detected.

### Model Management (`dependencies.py`)

To ensure fast performance after startup, all major models (CLIP, Whisper, Gemini) are loaded into a global cache on the first request and reused for all subsequent analyses. This is managed through FastAPI's dependency injection system.

---

## 5. Frontend Architecture

The frontend is a single-page application built with React and TypeScript, designed to provide a smooth and responsive user experience.

### State Management (`hooks/useVideoDetection.ts`)

A central custom hook, `useVideoDetection`, manages the entire application state. This includes:
-   `currentVideo`: An object representing the video being uploaded, processed, or viewed. It holds its status (`uploading`, `processing`, `completed`), progress, and the final result.
-   `history`: A list of previously analyzed videos.
-   `isProcessing`: A boolean flag to disable UI elements during analysis.
-   Handler functions like `handleFileSelect` and `resetCurrentVideo`.

### API Service Layer (`services/api.ts`)

This module abstracts all communication with the backend API.
-   `uploadVideo`: Handles the `POST` to `/api/analyze`.
-   `checkStatus`: Implements the polling logic for `/api/status/{job_id}`.
-   `getResults`: Fetches and, crucially, **maps** the final result from `/api/result/{job_id}` into the TypeScript `DetectionResult` type used throughout the app.
-   `analyzeVideo`: A wrapper function that orchestrates the polling flow: it uploads, polls for completion, and then fetches the results.

### Key UI Components (`components/`)

-   `UploadSection.tsx`: Provides the UI for uploading a file, including a drag-and-drop zone (`DropZone.tsx`) and progress indicators. It also includes `ExampleVideos.tsx` for users to try pre-selected files.
-   `DetectionResult.tsx`: A critical component that renders the final report. It displays the overall score, confidence, and a list of all analysis checks (passed and failed). It contains the video player, and when a user clicks a "View" button next to a failed check, it seeks the video to the timestamp of the detected anomaly event.
-   `HistorySection.tsx`: Displays a list of completed analyses.
-   `InfoSection.tsx`: Provides static content explaining the technology.

---

## 6. End-to-End Data Flow

1.  **Upload:** User drags a video file onto the `DropZone` in the `UploadSection`.
2.  **Initiate Analysis:** `useVideoDetection` hook calls `uploadVideo` service. The file is sent to `POST /api/analyze`.
3.  **Job Creation:** Backend creates a job ID and starts the analysis pipeline in the background. It returns the `job_id`.
4.  **Polling:** The frontend receives the `job_id` and the `analyzeVideo` service begins polling `GET /api/status/{job_id}` every few seconds. The UI updates to show a "Processing..." state.
5.  **Processing:** The backend pipeline executes, running all AI models and heuristics.
6.  **Completion:** The pipeline finishes, and the backend updates the job status to `completed` and stores the JSON result.
7.  **Fetch Results:** The frontend's poller sees the `completed` status and calls `getResults` with the `job_id`.
8.  **Render Results:** The `getResults` service fetches the JSON, maps it to the frontend's data types, and the `useVideoDetection` hook updates the state. React re-renders, and the `DetectionResult` component displays the full analysis to the user. 