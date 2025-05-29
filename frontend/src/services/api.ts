import { AnalyzedVideo, DetectionResult, DetectionTag, DetectionLabel } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadVideo = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return {
    id: data.job_id,
    url: URL.createObjectURL(file) // Create local preview URL
  };
};

export const checkStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
  return response.json();
};

export const getResults = async (jobId: string): Promise<DetectionResult> => {
  const response = await fetch(`${API_BASE_URL}/result/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  const data = await response.json();
  const result = data.result;

  return {
    label: result.label as DetectionLabel,
    confidenceScore: result.confidenceScore,
    tags: result.tags,
    processedAt: new Date().toLocaleString(),
    details: {
      visualScore: result.details.visualScore,
      videoLength: result.details.videoLength,
      originalVideoLength: result.details.originalVideoLength,
      transcriptSnippet: result.details.transcriptSnippet,
      geminiChecks: {
        visualArtifacts: result.details.geminiChecks.visualArtifacts,
        lipsyncIssue: result.details.geminiChecks.lipsyncIssue,
        abnormalBlinks: result.details.geminiChecks.abnormalBlinks
      }
    }
  };
};

export const analyzeVideo = async (jobId: string): Promise<DetectionResult> => {
  while (true) {
    const status = await checkStatus(jobId);
    
    if (status.status === 'completed') {
      return getResults(jobId);
    } else if (status.status === 'failed') {
      throw new Error('Analysis failed');
    }
    
    await delay(2000); // Poll every 2 seconds
  }
};