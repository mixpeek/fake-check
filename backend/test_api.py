import requests
import time
import os

def analyze_video(video_path: str):
    # 1. Upload video and get job_id
    url = "http://localhost:8000/api/analyze"
    
    print(f"\nUploading video: {os.path.basename(video_path)}")
    with open(video_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    if response.status_code != 200:
        raise Exception(f"Upload failed: {response.text}")
    
    job_id = response.json()['job_id']
    print(f"✅ Job submitted. ID: {job_id}")
    
    # 2. Poll status until complete
    print("\nWaiting for analysis to complete...")
    while True:
        status_response = requests.get(f"http://localhost:8000/api/status/{job_id}")
        status_data = status_response.json()
        
        if status_data['status'] == 'completed':
            break
        elif status_data['status'] == 'failed':
            raise Exception(f"Job failed: {status_data.get('error', 'Unknown error')}")
        
        print(f"Status: {status_data['status']}, Progress: {status_data['progress']}")
        time.sleep(2)  # Wait 2 seconds before next check
    
    # 3. Get results
    print("\nFetching results...")
    result_response = requests.get(f"http://localhost:8000/api/result/{job_id}")
    return result_response.json()

if __name__ == "__main__":
    # Path to the test video
    video_path = "videos_for_testing/Puppramin.mp4"
    
    try:
        result = analyze_video(video_path)
        print("\n📊 Final Results:")
        print(f"🔍 Is Real: {result['result']['isReal']}")
        print(f"📈 Confidence: {result['result']['confidenceScore']:.2%}")
        print(f"🏷️  Label: {result['result']['label']}")
        print(f"📝 Tags: {', '.join(result['result']['tags'])}")
        print(f"⏱️  Processing Time: {result['processing_time']:.1f} seconds")
        
        # Print detailed results
        print("\n🔎 Detailed Results:")
        details = result['result']['details']
        print(f"  • Visual Score: {details['visualScore']:.2f}")
        print(f"  • Video Length: {details['videoLength']:.1f}s")
        print(f"  • Original Length: {details['originalVideoLength']:.1f}s")
        print(f"  • Transcript: {details['transcriptSnippet']}")
        print("\n  Gemini Checks:")
        print(f"    • Visual Artifacts: {'✅' if details['geminiChecks']['visualArtifacts'] else '❌'}")
        print(f"    • Lip-sync Issues: {'✅' if details['geminiChecks']['lipsyncIssue'] else '❌'}")
        print(f"    • Abnormal Blinks: {'✅' if details['geminiChecks']['abnormalBlinks'] else '❌'}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}") 