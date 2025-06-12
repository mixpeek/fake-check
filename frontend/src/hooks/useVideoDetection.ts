import { useState, useCallback } from 'react';
import { AnalyzedVideo, HistoryItem } from '../types';
import { uploadVideo, analyzeVideo } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

export const useVideoDetection = () => {
  const { token } = useAuth();
  const [currentVideo, setCurrentVideo] = useState<AnalyzedVideo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!token) {
      // This case should ideally be prevented by the UI, but it's a good safeguard.
      alert("Please sign in to upload a video.");
      return;
    }

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
      const { id: jobId } = await uploadVideo(file, token, (progress) => {
        setCurrentVideo(prev => prev ? { ...prev, uploadProgress: progress } : null);
      });
      
      setCurrentVideo(prev => prev ? { ...prev, id: jobId, status: 'processing' } : null);
      
      const result = await analyzeVideo(jobId);
      
      setCurrentVideo(prev => prev ? { ...prev, status: 'completed', result } : null);
      
      const newHistoryItem: HistoryItem = {
        id: jobId,
        filename: file.name,
        thumbnailUrl: URL.createObjectURL(file),
        result: result,
        analyzedAt: new Date().toLocaleString(),
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      setCurrentVideo(prev => prev ? { ...prev, status: 'error', error: error.message } : null);
    }
  }, [token]);

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