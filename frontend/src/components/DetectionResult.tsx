import React, { useRef, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Check, X, Play, Pause, Info, ChevronDown, ChevronRight, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  documentationUrl?: string;
  technicalDetails?: string;
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "rounded-lg border",
      section.failed ? "bg-error-50 border-error-200" : "bg-success-50 border-success-200"
    )}>
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
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
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-4 w-4" />
            </button>
            {showTooltip && (
              <div 
                className="absolute z-50 w-64 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg"
              >
                {section.description}
                <div 
                  className="absolute left-1/2 top-full h-2 w-2 bg-gray-900 -translate-y-1/2 -translate-x-1/2 rotate-45"
                ></div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {section.score !== undefined && (
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded",
              section.failed ? "text-error-700 bg-error-100" : "text-success-700 bg-success-100"
            )}>
              {(section.score * 100).toFixed(1)}%
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-200/50">
              {/* Technical Details */}
              {section.technicalDetails && (
                <div className="mt-3 text-sm text-gray-700">
                  <p className="font-medium mb-1">How it works:</p>
                  <p>{section.technicalDetails}</p>
                </div>
              )}

              {/* Events with Timestamps */}
              {section.events && section.events.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {section.failed ? 'Issues detected:' : 'Analysis points:'}
                  </p>
                  <div className="space-y-2">
                    {section.events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/50 rounded text-sm border border-gray-200/50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">
                            {event.event.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </span>
                          <span className="text-gray-500">at {formatTimestamp(event.ts)}</span>
                        </div>
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
                </div>
              )}

              {/* Score Details */}
              {section.score !== undefined && (
                <div className="mt-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600">Confidence Score:</span>
                    <span className="font-medium text-gray-900">{(section.score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        section.failed ? "bg-error-500" : "bg-success-500"
                      )}
                      style={{ width: `${section.score * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {section.failed 
                      ? "Higher scores indicate more likely manipulation"
                      : "Lower scores indicate authentic content"
                    }
                  </p>
                </div>
              )}

              {/* Documentation Link */}
              {section.documentationUrl && (
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <a
                    href={section.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Learn more about this detection method
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      score: details.heuristicChecks.visual_clip,
      documentationUrl: 'https://mixpeek.com/extractors/real-person-classification',
      technicalDetails: 'Uses a pre-trained CLIP model to analyze visual features and detect synthetic patterns by comparing against millions of real and generated faces.'
    },
    {
      title: 'Visual Artifacts Check',
      description: 'Detects compression artifacts and visual inconsistencies.',
      failed: details.heuristicChecks.gemini_visual_artifacts > 0.5,
      score: details.heuristicChecks.gemini_visual_artifacts,
      documentationUrl: 'https://mixpeek.com/extractors/visual-artifact-detection',
      technicalDetails: 'Advanced AI scans for compression artifacts, warping distortions, unnatural skin textures, and flickering effects around face edges.'
    },
    {
      title: 'Blink Pattern Analysis',
      description: 'Analyzes natural eye movement patterns.',
      failed: details.heuristicChecks.gemini_blink_abnormality > 0.5,
      score: details.heuristicChecks.gemini_blink_abnormality,
      documentationUrl: 'https://mixpeek.com/extractors/blink-abnormality-detection',
      technicalDetails: 'Monitors blinking frequency and patterns. Humans naturally blink 15-20 times per minute with variation - AI often shows robotic patterns.'
    },
    {
      title: 'Lipsync Analysis',
      description: 'Checks for audio-visual synchronization issues.',
      failed: details.heuristicChecks.gemini_lipsync_issue > 0.5,
      score: details.heuristicChecks.gemini_lipsync_issue,
      events: details.events.filter(e => e.module === 'lip_sync'),
      documentationUrl: 'https://mixpeek.com/extractors/lipsync-analysis',
      technicalDetails: 'Extracts voiced segments and analyzes if lip movements genuinely match spoken words, detecting micro-delays invisible to human perception.'
    },
    {
      title: 'Text Analysis',
      description: 'Detects unnatural or generated text patterns.',
      failed: details.heuristicChecks.gibberish > 0.5,
      score: details.heuristicChecks.gibberish,
      events: details.events.filter(e => e.module === 'gibberish_text'),
      documentationUrl: 'https://mixpeek.com/extractors/gibberish-text-detection',
      technicalDetails: 'Performs OCR on video frames to detect corrupted text or gibberish characters that often appear in AI-generated content.'
    },
    {
      title: 'Motion Flow Analysis',
      description: 'Analyzes movement consistency and flow.',
      failed: details.heuristicChecks.flow > 0.5,
      score: details.heuristicChecks.flow,
      events: details.events.filter(e => e.module === 'flow'),
      documentationUrl: 'https://mixpeek.com/extractors/optical-flow-spike-detection',
      technicalDetails: 'Uses optical flow analysis to detect unnatural movement spikes and structural inconsistencies between frames in generated sequences.'
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
               {/* Transcript section commented out for now - can be re-enabled later
               {details.transcriptSnippet && 
                !details.transcriptSnippet.includes('No speech detected') &&
                !details.transcriptSnippet.includes('[Non-English language detected:') && (
                 <div className="mt-3 pt-3 border-t border-gray-100">
                   <p className="font-medium text-gray-700 mb-1">Transcript:</p>
                   <p className="italic">
                     {details.transcriptSnippet}
                   </p>
                 </div>
               )}
               */}
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
              <h5 className="text-sm font-medium text-error-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed Checks ({failedSections.length})
              </h5>
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
              <h5 className="text-sm font-medium text-success-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Passed Checks ({passedSections.length})
              </h5>
              {passedSections.map((section, index) => (
                <AnalysisSection
                  key={index}
                  section={section}
                  onViewIssue={seekToTimestamp}
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