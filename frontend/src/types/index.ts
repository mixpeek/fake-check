export type DetectionLabel = 'LIKELY_REAL' | 'UNCERTAIN' | 'LIKELY_FAKE';

export type DetectionTag = string;

export interface GeminiChecks {
  visualArtifacts: boolean;
  lipsyncIssue: boolean;
  abnormalBlinks: boolean;
}

export interface HeuristicChecks {
  visual_clip: number;
  gemini_visual_artifacts: number;
  gemini_lipsync_issue: number;
  gemini_blink_abnormality: number;
  ocr: number;
  flow: number;
  audio: number;
  video_ai: number;
}

export interface DetectionEvent {
  module: string;
  event: string;
  ts: number;
  dur: number;
  meta: Record<string, any>;
}

export interface DetectionDetails {
  visualScore: number;
  processingTime: number;
  videoLength: number;
  originalVideoLength: number;
  pipelineVersion: string;
  transcriptSnippet: string;
  geminiChecks: GeminiChecks;
  heuristicChecks: HeuristicChecks;
  error_message: string | null;
  error_trace: string | null;
  events: DetectionEvent[];
}

export type DetectionResult = {
  id: string;
  isReal: boolean;
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