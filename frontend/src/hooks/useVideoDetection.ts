import { useState, useCallback, useEffect, useRef } from 'react';
import { AnalyzedVideo, HistoryItem } from '../types';
import { uploadVideo, analyzeVideo } from '../services/api';
import { generateVideoThumbnail } from '../lib/utils';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  completed: boolean;
  active: boolean;
}

export const useVideoDetection = () => {
  const [currentVideo, setCurrentVideo] = useState<AnalyzedVideo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  
  const stageTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);

  const createProcessingStages = (videoLength: number): ProcessingStage[] => {
    // Adjust durations based on video length (longer videos = longer processing)
    const multiplier = Math.max(1, videoLength / 30); // Base on 30-second videos
    
    return [
      {
        id: 'extracting',
        name: 'Extracting frames',
        description: 'Breaking down video into individual frames for analysis',
        duration: Math.max(5, 8 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'visual_analysis',
        name: 'Running visual analysis',
        description: 'Using CLIP neural network to analyze visual patterns',
        duration: Math.max(15, 20 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'artifacts',
        name: 'Checking for artifacts',
        description: 'Scanning for compression artifacts and visual inconsistencies',
        duration: Math.max(10, 12 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'lipsync',
        name: 'Analyzing lip-sync patterns',
        description: 'Checking audio-visual synchronization',
        duration: Math.max(8, 12 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'blinks',
        name: 'Detecting blink abnormalities',
        description: 'Analyzing natural eye movement patterns',
        duration: Math.max(6, 10 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'text',
        name: 'Scanning for text corruption',
        description: 'Performing OCR to detect gibberish text',
        duration: Math.max(4, 8 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'motion',
        name: 'Analyzing motion flow',
        description: 'Detecting unnatural movement patterns',
        duration: Math.max(8, 12 * multiplier),
        completed: false,
        active: false
      },
      {
        id: 'finalizing',
        name: 'Finalizing results',
        description: 'Compiling analysis and generating report',
        duration: Math.max(3, 6 * multiplier),
        completed: false,
        active: false
      }
    ];
  };

  const startSimulatedProgress = useCallback((videoLength: number) => {
    const stages = createProcessingStages(videoLength);
    setProcessingStages(stages);
    setCurrentStageIndex(0);
    setSimulatedProgress(0);
    
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    setEstimatedTimeRemaining(totalDuration);

    let stageIndex = 0;
    let progressWithinStage = 0;
    const progressInterval = 100; // Update every 100ms for smooth animation

    // Clear any existing timers
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    // Start the first stage
    setProcessingStages(prev => prev.map((stage, index) => ({
      ...stage,
      active: index === 0,
      completed: false
    })));

    // Progress update timer
    progressTimerRef.current = setInterval(() => {
      if (stageIndex >= stages.length) return;

      const currentStage = stages[stageIndex];
      progressWithinStage += progressInterval / 1000; // Convert ms to seconds

      // Calculate overall progress
      const completedDuration = stages.slice(0, stageIndex).reduce((sum, stage) => sum + stage.duration, 0);
      const currentStageProgress = Math.min(progressWithinStage / currentStage.duration, 1);
      const overallProgress = (completedDuration + currentStageProgress * currentStage.duration) / totalDuration;
      
      setSimulatedProgress(overallProgress);
      
      // Update estimated time remaining
      const elapsed = completedDuration + progressWithinStage;
      setEstimatedTimeRemaining(Math.max(0, totalDuration - elapsed));

      // Check if current stage is complete
      if (progressWithinStage >= currentStage.duration) {
        // Mark current stage as completed
        setProcessingStages(prev => prev.map((stage, index) => ({
          ...stage,
          completed: index === stageIndex,
          active: index === stageIndex + 1
        })));

        stageIndex++;
        progressWithinStage = 0;
        setCurrentStageIndex(stageIndex);

        // If all stages complete, clear timer
        if (stageIndex >= stages.length) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setSimulatedProgress(1);
          setEstimatedTimeRemaining(0);
          setProcessingStages(prev => prev.map(stage => ({ ...stage, completed: true, active: false })));
        }
      }
    }, progressInterval);
  }, []);

  const stopSimulatedProgress = useCallback(() => {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    
    // Mark all stages as completed
    setProcessingStages(prev => prev.map(stage => ({ ...stage, completed: true, active: false })));
    setSimulatedProgress(1);
    setEstimatedTimeRemaining(0);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      return;
    }

    const videoData: AnalyzedVideo = {
      id: '',
      filename: file.name,
      fileSize: file.size,
      thumbnailUrl: URL.createObjectURL(file),
      result: null,
      status: 'uploading',
      uploadProgress: 0,
    };
    setCurrentVideo(videoData);

    try {
      const { id: jobId } = await uploadVideo(file, (progress) => {
        setCurrentVideo(prev => prev ? { ...prev, uploadProgress: progress } : null);
      });
      
      setCurrentVideo(prev => prev ? { ...prev, id: jobId, status: 'processing' } : null);
      
      // Estimate video length (rough calculation based on file size)
      const estimatedVideoLength = Math.max(10, Math.min(120, file.size / (1024 * 1024) * 10));
      startSimulatedProgress(estimatedVideoLength);
      
      const result = await analyzeVideo(jobId);
      
      // Stop simulated progress and show completion
      stopSimulatedProgress();
      
      setCurrentVideo(prev => prev ? { ...prev, status: 'completed', result } : null);
      
      const thumbnailUrl = await generateVideoThumbnail(file);
      
      const newHistoryItem: HistoryItem = {
        id: jobId,
        filename: file.name,
        thumbnailUrl: thumbnailUrl,
        result: result,
        analyzedAt: new Date().toLocaleString(),
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      
      stopSimulatedProgress();
      
      // Simple error handling
      let errorMessage = error.message || 'An unexpected error occurred during analysis. Please try again.';
      
      if (error.message.includes('Analysis timeout')) {
        errorMessage = 'Analysis timeout. The video processing took longer than expected. Please try again with a shorter video.';
      } else if (error.message.includes('Analysis failed on backend')) {
        errorMessage = 'Video analysis failed on the server. The video might be corrupted or in an unsupported format.';
      } else if (error.message.includes('Upload failed')) {
        errorMessage = 'Failed to upload video. Please check the file format and try again.';
      }
      
      setCurrentVideo(prev => prev ? { ...prev, status: 'error', error: errorMessage } : null);
    }
  }, [startSimulatedProgress, stopSimulatedProgress]);

  const resetCurrentVideo = () => {
    stopSimulatedProgress();
    setCurrentVideo(null);
    setProcessingStages([]);
    setCurrentStageIndex(0);
    setSimulatedProgress(0);
    setEstimatedTimeRemaining(0);
  };

  const isProcessing = currentVideo?.status === 'uploading' || currentVideo?.status === 'processing';

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  return {
    currentVideo,
    history,
    isProcessing,
    processingStages,
    currentStageIndex,
    simulatedProgress,
    estimatedTimeRemaining,
    handleFileSelect,
    resetCurrentVideo,
  };
};