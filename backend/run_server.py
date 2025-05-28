#!/usr/bin/env python
"""
Simple server runner for the deepfake detection API
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))


def main():
    """Run the FastAPI server"""
    # Check if .env file exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        print("⚠️  Warning: .env file not found!")
        print("Please copy .env.example to .env and add your API keys.")
        print()
    
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("DEBUG", "false").lower() == "true"
    
    print(f"🚀 Starting Deepfake Detection API")
    print(f"📍 Server running at: http://{host}:{port}")
    print(f"📚 API docs available at: http://{host}:{port}/docs")
    print(f"🔄 Auto-reload: {'enabled' if reload else 'disabled'}")
    print()
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )


if __name__ == "__main__":
    main()