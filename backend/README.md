# Deepfake Detection API v2

A FastAPI-based REST API for detecting deepfakes and AI-generated videos using a multi-layered detection pipeline. This system combines baseline AI models, a suite of heuristic detectors, and advanced analysis from Google Gemini to produce a comprehensive deepfake analysis report.

## Pipeline Overview

The detection pipeline processes videos through a series of modules to identify a wide range of potential anomalies:

1.  **Frame & Audio Sampling**: The video is first decoded into frames at a configurable FPS and its audio is extracted for separate analysis.

2.  **Baseline AI Analysis**:
    *   **CLIP**: A visual authenticity score is calculated by comparing video frames against prompts describing real vs. fake content.
    *   **Whisper**: The audio track is transcribed into text using OpenAI's multilingual `base` model.

3.  **Gemini Analysis Bundle**: Google's Gemini Pro model performs several checks in parallel:
    *   **Visual Artifacts**: Scans for common AI-generated visual distortions.
    *   **Lip-Sync Issues**: Compares the video's lip movements against the Whisper-generated transcript to detect desynchronization.
    *   **Abnormal Blinks**: Analyzes eye movements for unnatural blinking patterns.
    *   **Gibberish Text**: Examines frames for any text that appears nonsensical or corrupted.

4.  **Heuristic Detectors**: A set of specialized modules target specific, common deepfake indicators:
    *   `core/flow.py`: Detects unusual spikes in **optical flow** and sudden drops in **frame similarity (SSIM)**, indicating jarring transitions.
    *   `core/audio.py`: Analyzes the audio waveform for **loops** using autocorrelation.
    *    Optional - `core/video.py`: Uses the Google Cloud Video Intelligence API to find unnaturally short **shot changes** and lighting jumps.

5.  **Fusion Engine**: The scores and flags from all preceding modules are fed into a weighted fusion model (`core/fusion.py`). This engine calculates the final `overall_deepfake_confidence` score and assigns a label: `LIKELY_REAL`, `UNCERTAIN`, or `LIKELY_FAKE`.

6.  **Timeline Event Generation**: Every anomaly detected by any module is captured as a timestamped event, providing a detailed timeline of *what* was detected and *where* in the video it occurred.

## Prerequisites

- Python 3.9+
- FFmpeg installed on your system (`brew install ffmpeg` or `apt-get install ffmpeg`)
- API keys and Credentials:
  - Google Gemini API key
  - HuggingFace Token (for model downloads)
  - Google Cloud credentials file (`.json`) for the Video Intelligence API.

## Quick Start

1.  **Clone the project repository.**

2.  **Set up the environment**:
    ```bash
    # Create and activate a Python virtual environment
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate

    # Install dependencies
    pip install -r requirements.txt

    # Set up environment variables
    cp .env.example .env
    ```

3.  **Edit the `.env` file** and add your API keys:
    ```dotenv
    GEMINI_API_KEY="your_gemini_key_here"
    HF_TOKEN="your_huggingface_token_here"
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/google-cloud-key.json" # Optional: Disabled by Default
    ```

4.  **Set Google Cloud Credentials**: Ensure the path to your Google Cloud JSON key file is set as an environment variable.
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/google-cloud-key.json"
    ```

5.  **Run the server**:
    ```bash
    python run_server.py
    ```
    The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

## API Usage

### 1. Submit a video for analysis
Submits the video and immediately returns a `job_id`.

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file=@/path/to/your/video.mp4"
```

### 2. Check job status
Poll this endpoint with the `job_id` to check the status.

```bash
curl "http://localhost:8000/api/status/{job_id}"
```

### 3. Get results
Once the job status is `completed`, fetch the full analysis from this endpoint.

```bash
curl "http://localhost:8000/api/result/{job_id}"
```
The response contains the final label, confidence score, a list of human-readable tags, a `heuristicChecks` object with all module scores, and a detailed `events` timeline.

## Project Structure

```
.
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI endpoints & job handling
│   ├── config.py        # Model names & processing settings
│   ├── dependencies.py  # Model loading logic
│   ├── pipeline.py      # Main detection pipeline orchestrator
│   ├── schemas.py       # Pydantic data models for API
│   └── core/            # Core detection modules
│       ├── audio.py     # Audio loop detection
│       ├── flow.py      # Optical flow & SSIM analysis
│       ├── fusion.py    # Score fusion engine
│       ├── gemini.py    # All Gemini-based detectors
│       ├── models.py    # CLIP & Whisper model logic
│       └── video.py     # Frame/audio sampling & Video AI
├── .env.example         # Template for environment variables
├── requirements.txt
├── run_server.py        # Server runner script
└── test_api.py          # Example API client script
```

## Troubleshooting

- **FFmpeg not found**: Install using your system's package manager (e.g., `brew` or `apt-get`).
- **Model download fails**: Ensure your `HF_TOKEN` is set correctly in the `.env` file.
- **Gemini API errors**: Verify your `GEMINI_API_KEY` is valid and has not reached its rate limit.
- **Google Cloud API errors**: Ensure `GOOGLE_APPLICATION_CREDENTIALS` is pointing to a valid, authorized service account key file.
- **Incorrect Transcriptions**: Ensure `WHISPER_MODEL_NAME` in `app/config.py` is set to a multilingual model like `"base"` if processing non-English content.