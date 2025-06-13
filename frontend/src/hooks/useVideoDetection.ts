import { useState, useCallback } from 'react';
import { AnalyzedVideo, HistoryItem } from '../types';
import { uploadVideo, analyzeVideo } from '../services/api';
import { generateVideoThumbnail } from '../lib/utils';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export const useVideoDetection = () => {
  const [currentVideo, setCurrentVideo] = useState<AnalyzedVideo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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
      
      const result = await analyzeVideo(jobId);
      
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
      setCurrentVideo(prev => prev ? { ...prev, status: 'error', error: error.message } : null);
    }
  }, []);

  const resetCurrentVideo = () => {
    setCurrentVideo(null);
  };

  const isProcessing = currentVideo?.status === 'uploading' || currentVideo?.status === 'processing';

  return {
    currentVideo,
    history,
    isProcessing,
    handleFileSelect,
    resetCurrentVideo,
  };
};