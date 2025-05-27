import { AnalyzedVideo, DetectionResult, DetectionTag } from '../types';
import { getRandomInt } from '../lib/utils';

// This is a mock API service that simulates the backend API calls
// In a real application, these would be actual API calls to the FastAPI backend

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock function to generate a fake video thumbnail URL
const generateThumbnailUrl = (): string => {
  // Using a consistent thumbnail for testing
  return 'https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=300';
};

// Simulate file upload with progress reporting
export const uploadVideo = async (
  file: File, 
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string }> => {
  let progress = 0;
  
  // Simulate upload progress
  while (progress < 100) {
    await delay(300);
    progress += getRandomInt(5, 15);
    onProgress(Math.min(progress, 100));
  }
  
  // Return mock response
  return {
    id: Math.random().toString(36).substring(2, 15),
    url: generateThumbnailUrl()
  };
};

// Simulate video analysis
export const analyzeVideo = async (videoId: string): Promise<DetectionResult> => {
  // Simulate processing delay
  await delay(2000);
  
  // For testing, always return fake video detection
  const isReal = false;
  const confidenceScore = 0.89;
  
  // Return two specific tags for testing
  const tags: DetectionTag[] = [
    'Lipsync Issue Detected',
    'Visual Artifacts Detected'
  ];
  
  // Get current date/time for processed timestamp
  const processedAt = new Date().toLocaleString();
  
  return {
    isReal,
    confidenceScore,
    tags,
    processedAt
  };
};