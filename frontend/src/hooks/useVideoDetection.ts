import { useState, useCallback } from 'react';
import { AnalyzedVideo, HistoryItem } from '../types';
import { uploadVideo, analyzeVideo } from '../services/api';

export const useVideoDetection = () => {
  const [currentVideo, setCurrentVideo] = useState<AnalyzedVideo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    // Initialize video object
    setCurrentVideo({
      id: '',
      filename: file.name,
      fileSize: file.size,
      thumbnailUrl: '',
      result: null,
      status: 'uploading',
      uploadProgress: 0,
    });

    try {
      // Upload the file
      const { id, url } = await uploadVideo(file, (progress) => {
        setCurrentVideo((prev) => 
          prev ? { ...prev, uploadProgress: progress } : null
        );
      });

      // Update with upload complete and start processing
      setCurrentVideo((prev) => 
        prev ? { 
          ...prev, 
          id,
          thumbnailUrl: url,
          status: 'processing',
          uploadProgress: 100 
        } : null
      );

      // Process the video
      const result = await analyzeVideo(id);

      // Update with completed result
      setCurrentVideo((prev) => 
        prev ? { 
          ...prev, 
          result,
          status: 'completed',
        } : null
      );

      // Add to history
      const historyItem: HistoryItem = {
        id,
        filename: file.name,
        thumbnailUrl: url,
        result,
        analyzedAt: new Date().toLocaleString()
      };
      
      setHistory((prev) => [historyItem, ...prev]);
    } catch (error) {
      setCurrentVideo((prev) => 
        prev ? { 
          ...prev, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } : null
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetCurrentVideo = useCallback(() => {
    setCurrentVideo(null);
  }, []);

  return {
    currentVideo,
    history,
    isProcessing,
    handleFileSelect,
    resetCurrentVideo
  };
};