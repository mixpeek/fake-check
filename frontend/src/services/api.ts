import { 
  AnalyzedVideo, 
  DetectionResult, 
  DetectionTag, 
  DetectionLabel,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Configuration for polling
const POLL_INTERVAL_MS = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 200; // 10 minutes max (200 * 3s = 600s)
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds per request

// Helper function to create fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

export const uploadVideo = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData
  }, 30000); // 30 second timeout for upload

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  const data = await response.json();
  return {
    id: data.job_id,
    url: URL.createObjectURL(file)
  };
};

export const checkStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/status/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to check status');
  }
  return response.json();
};

export const getResults = async (jobId: string): Promise<DetectionResult> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/result/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  const data = await response.json();
  const result = data.result;

  return {
    id: result.id,
    isReal: result.isReal,
    label: result.label as DetectionLabel,
    confidenceScore: result.confidenceScore,
    tags: result.tags,
    processedAt: result.processedAt,
    details: {
      visualScore: result.details.visualScore,
      processingTime: result.details.processingTime,
      videoLength: result.details.videoLength,
      originalVideoLength: result.details.originalVideoLength,
      pipelineVersion: result.details.pipelineVersion,
      transcriptSnippet: result.details.transcriptSnippet,
      geminiChecks: {
        visualArtifacts: result.details.geminiChecks.visualArtifacts,
        lipsyncIssue: result.details.geminiChecks.lipsyncIssue,
        abnormalBlinks: result.details.geminiChecks.abnormalBlinks
      },
      heuristicChecks: result.details.heuristicChecks,
      error_message: result.details.error_message,
      error_trace: result.details.error_trace,
      events: result.events
    }
  };
};

export const analyzeVideo = async (jobId: string): Promise<DetectionResult> => {
  let attempts = 0;
  
  while (attempts < MAX_POLL_ATTEMPTS) {
    try {
      const status = await checkStatus(jobId);
      
      if (status.status === 'completed') {
        return getResults(jobId);
      } else if (status.status === 'failed') {
        throw new Error('Analysis failed');
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      attempts++;
      
    } catch (error) {
      attempts++;
      
      // If it's a network error and we haven't exceeded max attempts, retry
      if (attempts < MAX_POLL_ATTEMPTS && 
          (error instanceof Error && 
           (error.message.includes('fetch') || 
            error.message.includes('timeout') || 
            error.message.includes('network')))) {
        console.warn(`Polling attempt ${attempts} failed, retrying in ${POLL_INTERVAL_MS}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        continue;
      }
      
      // For other errors or if we've exceeded max attempts, throw
      throw error;
    }
  }
  
  throw new Error(`Analysis timeout: No response after ${MAX_POLL_ATTEMPTS} attempts (${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000 / 60} minutes)`);
};