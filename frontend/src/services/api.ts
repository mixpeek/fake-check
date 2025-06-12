import { 
  AnalyzedVideo, 
  DetectionResult, 
  DetectionTag, 
  DetectionLabel,
  User,
  LoginCredentials,
  SignupCredentials
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const uploadVideo = async (
  file: File, 
  token: string,
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 403) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Usage limit reached or access forbidden.');
    }
    throw new Error('Upload failed');
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
  const response = await fetch(`${API_BASE_URL}/api/status/${jobId}`);
  if (!response.ok) {
    throw new Error('Failed to check status');
  }
  return response.json();
};

export const getResults = async (jobId: string): Promise<DetectionResult> => {
  const response = await fetch(`${API_BASE_URL}/api/result/${jobId}`);
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
  while (true) {
    const status = await checkStatus(jobId);
    
    if (status.status === 'completed') {
      return getResults(jobId);
    } else if (status.status === 'failed') {
      throw new Error('Analysis failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
  }
};

// --- NEW: Auth Functions ---

export const signupUser = async (credentials: SignupCredentials): Promise<{ access_token: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Signup failed.');
  }
  return response.json();
};

export const loginUser = async (credentials: LoginCredentials): Promise<{ access_token: string }> => {
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed.');
  }
  return response.json();
};

export const getUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user data. Session may be expired.');
  }
  return response.json();
};