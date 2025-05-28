# FakeCheck API

A FastAPI-based REST API for detecting deepfakes and AI-generated videos using CLIP, Whisper, and Google Gemini models.

## Features

- 🎥 Analyzes videos for deepfake indicators
- 🤖 Uses multiple AI models (CLIP, Whisper, Gemini)
- ⚡ Asynchronous processing with background jobs
- 📊 Detailed analysis results with confidence scores
- 🔄 Progress tracking for long-running analyses

## Prerequisites

- Python 3.9+
- FFmpeg installed on your system
- API keys for:
  - Google Gemini API
  - HuggingFace (for model downloads)

## Installation

1. Clone the repository and navigate to the project directory:
```bash
cd deepfake-detector
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

5. Create the core modules directory and add your existing Python files:
```bash
mkdir -p app/core
# Copy your existing files:
# - video.py → app/core/video.py
# - models.py → app/core/models.py
# - gemini.py → app/core/gemini.py
# - fusion.py → app/core/fusion.py
```

## Running the API

### Simple method:
```bash
python run_server.py
```

### Using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API endpoint: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## API Usage

### 1. Submit a video for analysis

```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/video.mp4"
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
curl -X GET "http://localhost:8000/api/status/123e4567-e89b-12d3-a456-426614174000"
```

Response:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "progress": 0.5,
  "created_at": "2024-03-15T10:30:00Z",
  "started_at": "2024-03-15T10:30:05Z",
  "completed_at": null,
  "error": null
}
```

### 3. Get results

```bash
curl -X GET "http://localhost:8000/api/result/123e4567-e89b-12d3-a456-426614174000"
```

Response:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "result": {
    "id": "video_abc123",
    "isReal": false,
    "label": "LIKELY_FAKE",
    "confidenceScore": 0.25,
    "processedAt": "2024-03-15T10:35:00Z",
    "tags": [
      "Visual Anomaly Detected",
      "Lip-sync Issue Detected"
    ],
    "details": {
      "visualScore": 0.75,
      "processingTime": 120.5,
      "videoLength": 30.0,
      "originalVideoLength": 45.0,
      "pipelineVersion": "fastapi_v1",
      "transcriptSnippet": "Hello, this is a test video...",
      "geminiChecks": {
        "visualArtifacts": true,
        "lipsyncIssue": true,
        "abnormalBlinks": false
      }
    }
  },
  "processing_time": 125.3
}
```

## Configuration

Edit `.env` file to configure:

- **API Keys**: `GEMINI_API_KEY`, `HF_TOKEN`
- **Model Settings**: Model names and versions
- **Processing**: FPS, max video duration, file size limits
- **Device**: CPU/GPU selection (set `DEVICE=mps` for Apple Silicon)

## Frontend Integration

The API supports CORS for localhost development. To integrate with your frontend:

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
  const statusRes = await fetch(`http://localhost:8000/api/status/${job_id}`);
  const status = await statusRes.json();
  
  if (status.status === 'completed') {
    const resultRes = await fetch(`http://localhost:8000/api/result/${job_id}`);
    const result = await resultRes.json();
    // Process result
  } else if (status.status === 'failed') {
    // Handle error
  } else {
    // Continue polling
    setTimeout(checkStatus, 2000);
  }
};
```

## Performance Tips

1. **Enable model preloading** for faster processing:
   ```env
   PRELOAD_MODELS=true
   ```

2. **Use GPU acceleration** if available:
   ```env
   DEVICE=cuda  # For NVIDIA GPUs
   DEVICE=mps   # For Apple Silicon
   ```

3. **Adjust processing parameters**:
   ```env
   TARGET_FPS=6  # Lower FPS for faster processing
   ```

## Troubleshooting

1. **Models not downloading**: Ensure `HF_TOKEN` is set correctly
2. **Gemini API errors**: Verify `GEMINI_API_KEY` is valid
3. **FFmpeg errors**: Ensure FFmpeg is installed: `brew install ffmpeg` (macOS)
4. **Memory issues**: Reduce batch size or use CPU processing

## Development

To modify the detection pipeline, edit the files in `app/core/`:
- `video.py`: Video frame/audio extraction
- `models.py`: CLIP and Whisper processing
- `gemini.py`: Gemini model checks
- `fusion.py`: Score fusion logic

## License

This project is part of a deepfake detection demo. See LICENSE for details.