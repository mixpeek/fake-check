import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { DetectionResult as DetectionResultType, DetectionLabel } from '../types';
import { DetectionTagBadge } from './ui/Badge';
import { cn } from '../lib/utils';

interface DetectionResultProps {
  result: DetectionResultType;
}

const getResultStyles = (label: DetectionLabel) => {
  switch (label) {
    case 'LIKELY_REAL':
      return {
        bgColor: 'bg-success-500',
        icon: <CheckCircle className="h-8 w-8 text-white mr-3" />,
        text: 'Real'
      };
    case 'LIKELY_FAKE':
      return {
        bgColor: 'bg-error-500',
        icon: <XCircle className="h-8 w-8 text-white mr-3" />,
        text: 'Fake'
      };
    case 'UNCERTAIN':
      return {
        bgColor: 'bg-warning-500',
        icon: <AlertTriangle className="h-8 w-8 text-white mr-3" />,
        text: 'Uncertain'
      };
  }
};

export const DetectionResult: React.FC<DetectionResultProps> = ({ result }) => {
  const { label, confidenceScore, tags, details } = result;
  const score = Math.round(confidenceScore * 100);
  const styles = getResultStyles(label);

  return (
    <motion.div
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={cn("p-6", styles.bgColor)}>
        <div className="flex items-center">
          {styles.icon}
          <div>
            <h3 className="text-xl font-bold text-white">
              {score}% Confidence: {styles.text}
            </h3>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-white">
        <div className="space-y-6">
          {/* Tags Section */}
          <div>
            <h4 className="text-lg font-medium mb-3">Detected Anomalies</h4>
            <div className="space-y-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning-500 mr-2" />
                  <span>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini Checks */}
          <div>
            <h4 className="text-lg font-medium mb-3">Analysis Results</h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                {details.geminiChecks.visualArtifacts ? (
                  <X className="h-4 w-4 text-error-500 mr-2" />
                ) : (
                  <Check className="h-4 w-4 text-success-500 mr-2" />
                )}
                <span>Visual Artifacts Check</span>
              </div>
              <div className="flex items-center text-sm">
                {details.geminiChecks.lipsyncIssue ? (
                  <X className="h-4 w-4 text-error-500 mr-2" />
                ) : (
                  <Check className="h-4 w-4 text-success-500 mr-2" />
                )}
                <span>Lip Sync Check</span>
              </div>
              <div className="flex items-center text-sm">
                {details.geminiChecks.abnormalBlinks ? (
                  <X className="h-4 w-4 text-error-500 mr-2" />
                ) : (
                  <Check className="h-4 w-4 text-success-500 mr-2" />
                )}
                <span>Natural Blink Pattern Check</span>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h4 className="text-lg font-medium mb-3">Video Details</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Visual Analysis Score: {(details.visualScore * 100).toFixed(1)}%</p>
              <p>Video Length: {details.videoLength.toFixed(1)}s</p>
              <p>Original Length: {details.originalVideoLength.toFixed(1)}s</p>
              {details.transcriptSnippet && (
                <div>
                  <p className="font-medium text-gray-700">Transcript:</p>
                  <p className="italic">{details.transcriptSnippet}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-500">Analysis Completed</h4>
          <p className="text-sm text-gray-500">{result.processedAt}</p>
        </div>
      </div>
    </motion.div>
  );
};