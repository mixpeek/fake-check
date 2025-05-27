export type DetectionTag = 
  | 'Lipsync Issue Detected'
  | 'Anomaly Detected'
  | 'Visual Artifacts Detected'
  | 'Unusual Blink Pattern Detected';

export type DetectionResult = {
  isReal: boolean;
  confidenceScore: number;
  tags: DetectionTag[];
  processedAt: string;
};

export type AnalyzedVideo = {
  id: string;
  filename: string;
  fileSize: number;
  thumbnailUrl: string;
  result: DetectionResult | null;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  uploadProgress: number;
};

export type HistoryItem = {
  id: string;
  filename: string;
  thumbnailUrl: string;
  result: DetectionResult;
  analyzedAt: string;
};