import React, { useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Check, X, Play, Pause, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { DetectionResult as DetectionResultType, DetectionLabel, DetectionEvent } from '../types';
import { cn } from '../lib/utils';

interface DetectionResultProps {
  result: DetectionResultType;
  videoUrl: string;
}

interface AnalysisSection {
  title: string;
  description: string;
  failed: boolean;
  events?: DetectionEvent[];
  score?: number;
}

const getResultStyles = (label: DetectionLabel) => {
  switch (label) {
    case 'LIKELY_REAL':
      return {
        bgColor: 'bg-success-500',
        textColor: 'text-success-700',
        icon: <CheckCircle className="h-5 w-5 text-success-600" />,
        text: 'Real'
      };
    case 'LIKELY_FAKE':
      return {
        bgColor: 'bg-error-100',
        textColor: 'text-error-700',
        icon: <XCircle className="h-5 w-5 text-error-600" />,
        text: 'Fake'
      };
    case 'UNCERTAIN':
      return {
        bgColor: 'bg-warning-100',
        textColor: 'text-warning-700',
        icon: <AlertTriangle className="h-5 w-5 text-warning-600" />,
        text: 'Uncertain'
      };
  }
};

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AnalysisSection: React.FC<{
  section: AnalysisSection;
  onViewIssue?: (timestamp: number) => void;
}> = ({ section, onViewIssue }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={cn(
      "rounded-lg overflow-hidden",
      section.failed ? "bg-error-50" : "bg-success-50"
    )}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {section.failed ? (
            <X className="h-4 w-4 text-error-600" />
          ) : (
            <Check className="h-4 w-4 text-success-600" />
          )}
          <span className="font-medium text-gray-900">{section.title}</span>
          <div className="relative inline-block">
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="h-4 w-4" />
            </button>
            {showTooltip && (
              <div className="fixed z-50 w-64 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg" style={{
                transform: 'translateX(-50%) translateY(-100%)',
                left: '50%',
                marginTop: '-8px'
              }}>
                {section.description}
                <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-gray-900" style={{
                  transform: 'translateX(-50%) translateY(50%) rotate(45deg)'
                }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {section.failed && section.events && section.events.length > 0 && (
        <div className="px-4 pb-3">
          {section.events.map((event, index) => (
            <div key={index} className="flex items-center justify-between py-2 text-sm">
              <span className="text-gray-700">
                {event.event.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')} at {formatTimestamp(event.ts)}
              </span>
              {onViewIssue && (
                <button
                  onClick={() => onViewIssue(event.ts)}
                  className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1 hover:bg-white/50 px-2 py-1 rounded transition-colors"
                >
                  <Play className="h-3 w-3" />
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {section.score !== undefined && (
        <div className="px-4 pb-3">
          <div className="text-sm text-gray-700">
            Score: {(section.score * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};

export const DetectionResult: React.FC<DetectionResultProps> = ({ result, videoUrl }) => {
  const { label, confidenceScore, details } = result;
  const score = Math.round(confidenceScore * 100);
  const styles = getResultStyles(label);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekToTimestamp = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const analysisSections: AnalysisSection[] = [
    {
      title: 'Visual Analysis (CLIP)',
      description: 'Neural network analysis of visual patterns and inconsistencies.',
      failed: details.heuristicChecks.visual_clip > 0.5,
      score: details.heuristicChecks.visual_clip
    },
    {
      title: 'Visual Artifacts Check',
      description: 'Detects compression artifacts and visual inconsistencies.',
      failed: details.heuristicChecks.gemini_visual_artifacts > 0.5,
      events: details.events.filter(e => e.module === 'flow' || e.event === 'visual_artifact')
    },
    {
      title: 'Lipsync Analysis',
      description: 'Checks for audio-visual synchronization issues.',
      failed: details.heuristicChecks.gemini_lipsync_issue > 0.5,
      events: details.events.filter(e => e.event === 'lipsync_mismatch')
    },
    {
      title: 'Blink Pattern Analysis',
      description: 'Analyzes natural eye movement patterns.',
      failed: details.heuristicChecks.gemini_blink_abnormality > 0.5,
      events: details.events.filter(e => e.event === 'abnormal_blink')
    },
    {
      title: 'Text Analysis',
      description: 'Detects unnatural or generated text patterns.',
      failed: details.heuristicChecks.ocr > 0.5,
      events: details.events.filter(e => e.event === 'gibberish_text')
    },
    {
      title: 'Motion Flow Analysis',
      description: 'Analyzes movement consistency and flow.',
      failed: details.heuristicChecks.flow > 0.5,
      events: details.events.filter(e => e.event === 'flow_spike')
    },
    {
      title: 'Audio Analysis',
      description: 'Detects audio anomalies and loops.',
      failed: details.heuristicChecks.audio > 0.5,
      events: details.events.filter(e => e.module === 'audio')
    },
    {
      title: 'Light Changes Analysis',
      description: 'Detects unnatural lighting changes.',
      failed: details.heuristicChecks.video_ai > 0.5,
      events: details.events.filter(e => e.event === 'light_change')
    }
  ];

  const failedSections = analysisSections.filter(section => section.failed);
  const passedSections = analysisSections.filter(section => !section.failed);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Video Player and Details */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Confidence Banner */}
          <div className={cn(
            "rounded-lg px-4 py-3 flex items-center",
            styles.bgColor
          )}>
            {styles.icon}
            <span className={cn("font-medium ml-2", styles.textColor)}>
              {score}% Confidence: {styles.text}
            </span>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlayPause}
              className="absolute bottom-4 left-4 bg-white/90 hover:bg-white p-2.5 rounded-full transition-colors shadow-md"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-gray-900" />
              ) : (
                <Play className="h-5 w-5 text-gray-900" />
              )}
            </button>
          </div>

          {/* Video Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Video Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Video Length: {details.videoLength.toFixed(1)}s</p>
              <p>Original Length: {details.originalVideoLength.toFixed(1)}s</p>
              {details.transcriptSnippet && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="font-medium text-gray-700 mb-1">Transcript:</p>
                  <p className="italic">{details.transcriptSnippet}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Analysis Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100"
      >
        <div className="p-6">
          <h4 className="font-medium text-gray-900 mb-6">Analysis Results</h4>
          
          {/* Failed Checks */}
          {failedSections.length > 0 && (
            <div className="space-y-3 mb-6">
              <h5 className="text-sm font-medium text-error-600">Failed Checks</h5>
              {failedSections.map((section, index) => (
                <AnalysisSection
                  key={index}
                  section={section}
                  onViewIssue={seekToTimestamp}
                />
              ))}
            </div>
          )}

          {/* Passed Checks */}
          {passedSections.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-success-600">Passed Checks</h5>
              {passedSections.map((section, index) => (
                <AnalysisSection
                  key={index}
                  section={section}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 rounded-b-lg">
          Analysis completed {new Date(result.processedAt).toLocaleString()}
        </div>
      </motion.div>
    </div>
  );
};