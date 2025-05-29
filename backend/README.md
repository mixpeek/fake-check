# Deepfake Detection API

A FastAPI-based REST API for detecting deepfakes and AI-generated videos using CLIP, Whisper, and Google Gemini models.

## Features

- 🎥 Analyzes videos for deepfake indicators
- 🤖 Uses multiple AI models (CLIP, Whisper, Gemini)
- ⚡ Asynchronous processing with background jobs
- 📊 Returns confidence scores and detection labels

## Prerequisites

- Python 3.9+
- FFmpeg installed on your system
- API keys:
  - Google Gemini API key
  - HuggingFace token (for model downloads)

## Quick Start

1. **Clone and set up the project**:
```bash
# Create the project structure
mkdir deepfake-detector
cd deepfake-detector

# Create directories
mkdir -p app/core

# Copy your existing Python files to app/core/
# - video.py
# - models.py
# - gemini.py
# - fusion.py
```

2. **Set up environment**:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_key_here
# HF_TOKEN=your_token_here
```

3. **Run the server**:
```bash
python run_server.py
```

The API will be available at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

## API Usage

### 1. Submit a video for analysis

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file=@/path/to/video.mp4"
```

Response:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Video submitted for analysis",
  "status": "pending"
}
```

### 2. Check job status

```bash
curl "http://localhost:8000/api/status/{job_id}"
```

### 3. Get results

```bash
curl "http://localhost:8000/api/result/{job_id}"
```

Returns detection results with:
- `label`: "LIKELY_REAL", "UNCERTAIN", or "LIKELY_FAKE"
- `confidenceScore`: 0-1 (higher means more likely real)
- `tags`: List of detected anomalies

## Frontend Integration

```javascript
// Submit video
const formData = new FormData();
formData.append('file', videoFile);

const response = await fetch('http://localhost:8000/api/analyze', {
  method: 'POST',
  body: formData
});

const { job_id } = await response.json();

// Poll for results
const checkStatus = async () => {
  const res = await fetch(`http://localhost:8000/api/status/${job_id}`);
  const data = await res.json();
  
  if (data.status === 'completed') {
    const result = await fetch(`http://localhost:8000/api/result/${job_id}`);
    return await result.json();
  }
  
  // Continue polling
  setTimeout(checkStatus, 2000);
};
```

## Project Structure

```
deepfake-detector/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI endpoints
│   ├── config.py        # Configuration
│   ├── dependencies.py  # Model loading
│   ├── pipeline.py      # Detection pipeline
│   ├── schemas.py       # Data models
│   └── core/           # Your detection modules
│       ├── video.py
│       ├── models.py
│       ├── gemini.py
│       └── fusion.py
├── .env                # API keys (create from .env.example)
├── requirements.txt
└── run_server.py
```

## Notes

- Videos longer than 30 seconds are truncated
- Models are downloaded on first run (may take time)
- Processing typically takes 60-120 seconds per video

## Troubleshooting

- **FFmpeg not found**: Install with `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)
- **Model download fails**: Ensure HF_TOKEN is set correctly
- **Gemini API errors**: Verify GEMINI_API_KEY is valid