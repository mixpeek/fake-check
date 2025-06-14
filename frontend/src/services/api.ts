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
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds per request (under browser timeout limits)
const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes for upload

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

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData
    }, UPLOAD_TIMEOUT_MS); // 2 minute timeout for upload

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || 'Upload failed');
    }

    const data = await response.json();
    return {
      id: data.job_id,
      url: URL.createObjectURL(file)
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Request timeout')) {
        throw new Error('Upload timeout: The file upload took longer than expected. This might be due to a slow connection or large file size. Please try again with a smaller file or check your internet connection.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Upload failed: Unable to connect to the server. Please check your internet connection and try again.');
      }
    }
    throw error;
  }
};

export const checkStatus = async (jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}> => {
  // Use a longer timeout for status checks since backend might be busy with Gemini calls
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/status/${jobId}`, {}, 120000); // 2 minute timeout
  if (!response.ok) {
    throw new Error('Failed to check status');
  }
  return response.json();
};

export const getResults = async (jobId: string): Promise<DetectionResult> => {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/result/${jobId}`, {}, 120000); // 2 minute timeout
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
  let pollAttempts = 0;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;
  
  while (pollAttempts < MAX_POLL_ATTEMPTS) {
    try {
      const status = await checkStatus(jobId);
      
      // Reset consecutive error count on successful request
      consecutiveErrors = 0;
      
      if (status.status === 'completed') {
        return getResults(jobId);
      } else if (status.status === 'failed') {
        throw new Error('Analysis failed on backend');
      }
      
      // Wait before next poll attempt
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      pollAttempts++;
      
    } catch (error) {
      consecutiveErrors++;
      
      console.error('Polling error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        pollAttempt: pollAttempts + 1,
        consecutiveErrors: consecutiveErrors,
        timestamp: new Date().toISOString()
      });
      
      // If we've had too many consecutive errors, give up
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error(`Too many consecutive polling errors (${consecutiveErrors}). The backend may be experiencing issues.`);
      }
      
      // For timeout/network errors, wait longer before retrying
      if (error instanceof Error && 
          (error.message.includes('timeout') || 
           error.message.includes('Request timeout') ||
           error.message.includes('Failed to fetch'))) {
        
        console.warn(`Request timeout during polling (attempt ${pollAttempts + 1}, consecutive errors: ${consecutiveErrors}). Backend is busy with long Gemini operations. Waiting longer before retry...`);
        
        // Wait progressively longer for consecutive errors
        const waitTime = Math.min(10000 + (consecutiveErrors * 5000), 30000); // 10s, 15s, 20s, max 30s
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue; // Don't increment pollAttempts for timeouts
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw new Error(`Analysis timeout: No response after ${MAX_POLL_ATTEMPTS} poll attempts (${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000 / 60} minutes)`);
};