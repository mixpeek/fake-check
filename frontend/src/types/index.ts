export type DetectionLabel = 'LIKELY_REAL' | 'UNCERTAIN' | 'LIKELY_FAKE';

export type DetectionTag = string;

export interface GeminiChecks {
  visualArtifacts: boolean;
  lipsyncIssue: boolean;
  abnormalBlinks: boolean;
}

export interface DetectionDetails {
  visualScore: number;
  videoLength: number;
  originalVideoLength: number;
  transcriptSnippet: string;
  geminiChecks: GeminiChecks;
}

export type DetectionResult = {
  label: DetectionLabel;
  confidenceScore: number;
  tags: DetectionTag[];
  processedAt: string;
  details: DetectionDetails;
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