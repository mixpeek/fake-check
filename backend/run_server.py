#!/usr/bin/env python
"""
Simple server runner for the deepfake detection API
"""
import os
import uvicorn
from pathlib import Path


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
    print("📍 Server running at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print()
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()