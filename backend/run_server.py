#!/usr/bin/env python
"""
Simple server runner for the deepfake detection API
"""
import os
import uvicorn
from pathlib import Path
import logging

# Configure logging to reduce verbosity from noisy libraries
logging.basicConfig(level=logging.INFO)
noisy_loggers = [
    "numba", "h5py", "torio", "torchaudio", 
    "urllib3", "filelock", "grpc", "asyncio"
]
for logger_name in noisy_loggers:
    logging.getLogger(logger_name).setLevel(logging.WARNING)


def main():
    """Run the FastAPI server"""
    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print("⚠️  Warning: .env file not found!")
        print("Please copy .env.example to .env and add your API keys:")
        print("  - GEMINI_API_KEY")
        print("  - HF_TOKEN")
        print()
    
    print("🚀 Starting Deepfake Detection API")
    print("📍 Server running at: http://localhost:8001")
    print("📚 API docs available at: http://localhost:8001/docs")
    print()

    # Run the server with debug logging
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
        access_log=True
    )


if __name__ == "__main__":
    main()