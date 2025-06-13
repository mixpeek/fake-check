# FakeCheck: AI-Powered Deepfake Detection Platform

This repository contains the source code for FakeCheck, a full-stack application designed to detect deepfakes and AI-generated video content. It features a React/TypeScript frontend and a Python/FastAPI backend that work together to provide a seamless user experience.

## Overview

The platform allows users to upload a video file, which is then analyzed by a sophisticated pipeline on the backend. The analysis involves multiple AI models and heuristic checks to identify visual artifacts, lip-sync issues, abnormal blinking, and other tell-tale signs of manipulation. The results are then presented in a detailed, user-friendly report on the frontend.

## Architecture

*   **Backend**: A powerful FastAPI-based REST API that orchestrates the deepfake detection pipeline. It uses CLIP for visual authenticity scoring, Whisper for audio transcription, and Google's Gemini Pro for advanced visual and audio analysis.
*   **Frontend**: A modern, responsive web application built with React, TypeScript, and Tailwind CSS. It provides the user interface for uploading videos and viewing the analysis results.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Python 3.10**
*   **Node.js v18+**
*   **FFmpeg**: (`brew install ffmpeg` on macOS or `sudo apt-get install ffmpeg` on Debian/Ubuntu)
*   **API Keys**:
    *   Google Gemini API Key
    *   HuggingFace Token (for model downloads)
    *   Optional: Google Cloud Credentials - A JSON key file for a service account with the Video Intelligence API enabled. Only add if you enable Google Video Intelligence lighting shift detection.

## Getting Started

Follow these steps to set up and run the entire application locally.

### 1. Clone the Repository

```bash
git clone https://github.com/mixpeek/fake-check.git
cd FakeCheck
```

### 2. Backend Setup

First, let's get the backend server running.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python3.10 -m venv venv
    source venv/bin/activate
    # On Windows, use: venv\Scripts\activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Copy the example `.env` file and fill in your API keys.
    ```bash
    cp .env.example .env
    ```
    Now, edit the `.env` file with your credentials:
    ```dotenv
    GEMINI_API_KEY="your_gemini_key_here"
    HF_TOKEN="your_huggingface_token_here"
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/google-cloud-key.json" # Optional: Disabled by Default
    ```

5.  **Run the Backend Server:**
    ```bash
    python run_server.py
    ```
    The backend API will now be running at `http://localhost:8000`.

### 3. Frontend Setup

With the backend running, open a **new terminal window** and set up the frontend.

1.  **Navigate to the frontend directory:**
    ```bash
    # From the project root
    cd frontend
    ```

2.  **Install NPM dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:5173`. It is pre-configured to connect to the backend API running on `http://localhost:8000`.

You can now open `http://localhost:5173` in your browser to use the application.