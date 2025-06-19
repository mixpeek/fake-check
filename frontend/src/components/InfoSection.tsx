import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Layers, 
  Brain, 
  GitMerge, 
  CheckCircle, 
  Eye, 
  Mic, 
  Search, 
  AlertTriangle, 
  Activity, 
  ExternalLink, 
  Shield,
  PlayCircle,
  FileVideo,
  Zap
} from 'lucide-react';

interface PipelineStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  details: string[];
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 1,
    title: "Upload",
    subtitle: "Video Input",
    description: "Secure video upload with format validation and preprocessing",
    icon: <Upload className="h-6 w-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    details: [
      "Supports MP4, MOV, AVI, WEBM formats",
      "Automatic compression and optimization",
      "Privacy-first processing with automatic deletion",
      "Real-time upload progress tracking"
    ]
  },
  {
    id: 2,
    title: "Sample",
    subtitle: "Extract Frames",
    description: "Intelligent frame extraction and preprocessing for analysis",
    icon: <Layers className="h-6 w-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    details: [
      "Smart keyframe detection",
      "High-quality frame extraction",
      "Temporal sampling optimization",
      "Face detection and cropping"
    ]
  },
  {
    id: 3,
    title: "Analyze",
    subtitle: "Multi-Model Detection",
    description: "Parallel analysis across 6 different AI detection methods",
    icon: <Brain className="h-6 w-6" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    details: [
      "CLIP neural network analysis",
      "Visual artifact detection",
      "Lipsync pattern analysis",
      "Blink abnormality detection",
      "Text corruption scanning",
      "Motion flow analysis"
    ]
  },
  {
    id: 4,
    title: "Fusion",
    subtitle: "Score Integration",
    description: "Advanced fusion algorithm combines all detection results",
    icon: <GitMerge className="h-6 w-6" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    details: [
      "Weighted score combination",
      "Confidence level calculation",
      "Cross-validation between methods",
      "Statistical significance testing"
    ]
  },
  {
    id: 5,
    title: "Results",
    subtitle: "Final Analysis",
    description: "Comprehensive report with detailed breakdown and insights",
    icon: <CheckCircle className="h-6 w-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    details: [
      "Overall authenticity score",
      "Detailed method breakdown",
      "Confidence indicators",
      "Timestamp-based insights",
      "Actionable recommendations"
    ]
  }
];

export const InfoSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  return (
    <section id="how-it-works" className="w-full bg-gradient-to-br from-gray-100 via-white to-gray-100 py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-6">
            How <span className="text-gradient-primary">FakeCheck</span> Works
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed font-medium">
            Our multi-stage AI pipeline analyzes videos across 6 dimensions to detect even the most sophisticated deepfakes
          </p>
        </motion.div>

        {/* Interactive Pipeline */}
        <div className="mb-20">
          {/* Step Indicators */}
          <div className="relative mb-12">
            {/* Background connecting line */}
            <div className="absolute top-8 left-0 right-0 h-1 flex items-center">
              <div className="w-8"></div>
              <div className="flex-1 h-1 bg-gray-300"></div>
              <div className="w-8"></div>
            </div>
            
            {/* Active progress line */}
            <div className="absolute top-8 left-0 right-0 h-1 flex items-center">
              <div className="w-8"></div>
              <div className="flex-1 h-1 relative overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: (activeStep - 1) / (pipelineSteps.length - 1) }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="w-8"></div>
            </div>

            <div className="flex justify-between items-center relative z-10">
              {pipelineSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setActiveStep(step.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Step Circle */}
                  <motion.div
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      activeStep === step.id
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                        : activeStep > step.id
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-blue-400 text-blue-400'
                    }`}
                    animate={activeStep === step.id ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-2xl font-black">{step.id}</span>
                  </motion.div>

                  {/* Step Labels */}
                  <div className="text-center mt-4">
                    <h3 className={`font-bold text-sm transition-colors ${
                      activeStep === step.id ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{step.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Interactive Pipeline SVG */}
          <motion.div
            className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-12 shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="w-full" style={{ aspectRatio: '1400/600' }}>
              <svg viewBox="0 0 1400 600" className="w-full h-full">
                {/* Definitions for gradients, patterns, and effects */}
                <defs>
                  {/* Enhanced gradients matching the UI theme */}
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                  </linearGradient>
                  
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
                  </linearGradient>
                  
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
                  </linearGradient>
                  
                  <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                  </linearGradient>
                  
                  {/* Glow effect */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  {/* Shadow effect */}
                  <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="0" dy="4" result="offsetblur"/>
                    <feFlood floodColor="#000000" floodOpacity="0.1"/>
                    <feComposite in2="offsetblur" operator="in"/>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  {/* Flow arrow markers */}
                  <marker id="flowArrow" markerWidth="12" markerHeight="8" refX="12" refY="4" orient="auto">
                    <path d="M 0 0 L 12 4 L 0 8 Z" fill="#667eea" opacity="0.8"/>
                  </marker>
                  
                  {/* Pattern for background */}
                  <pattern id="gridPattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
                  </pattern>
                </defs>

                {/* Clean white background */}
                <rect width="1400" height="600" fill="white"/>
                
                {/* Stage 1: Upload */}
                <g 
                  className={`cursor-pointer transition-all duration-300 ${activeStep === 1 ? 'filter brightness-110' : 'opacity-70'}`}
                  onClick={() => setActiveStep(1)}
                  style={{ filter: activeStep === 1 ? 'url(#glow)' : 'none' }}
                  transform="translate(80, 80)"
                >
                  <rect x="0" y="0" width="180" height="140" rx="16" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="0" width="180" height="6" rx="3" fill="url(#purpleGrad)"/>
                  
                  <text x="90" y="35" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#6b7280">STAGE 1</text>
                  <text x="90" y="70" textAnchor="middle" fontSize="36">📤</text>
                  <text x="90" y="95" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1a1a1a">Input Video</text>
                  <text x="90" y="115" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">MP4, MOV, AVI</text>
                </g>

                {/* Stage 2: Content Sampling */}
                <g 
                  className={`cursor-pointer transition-all duration-300 ${activeStep === 2 ? 'filter brightness-110' : 'opacity-70'}`}
                  onClick={() => setActiveStep(2)}
                  style={{ filter: activeStep === 2 ? 'url(#glow)' : 'none' }}
                  transform="translate(320, 80)"
                >
                  <rect x="0" y="0" width="200" height="140" rx="16" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="0" width="200" height="6" rx="3" fill="url(#blueGrad)"/>
                  
                  <text x="100" y="35" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#6b7280">STAGE 2</text>
                  <text x="100" y="70" textAnchor="middle" fontSize="36">⚙️</text>
                  <text x="100" y="95" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1a1a1a">Content Sampling</text>
                  <text x="100" y="115" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">Extract frames &amp; audio</text>
                </g>

                {/* Stage 3: AI Analysis */}
                <g 
                  className={`cursor-pointer transition-all duration-300 ${activeStep === 3 ? 'filter brightness-110' : 'opacity-70'}`}
                  onClick={() => setActiveStep(3)}
                  style={{ filter: activeStep === 3 ? 'url(#glow)' : 'none' }}
                  transform="translate(580, 40)"
                >
                  <rect x="0" y="20" width="240" height="480" rx="16" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="20" width="240" height="6" rx="3" fill="url(#purpleGrad)"/>
                  
                  <text x="120" y="55" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#6b7280">STAGE 3</text>
                  <text x="120" y="80" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="20" fontWeight="600" fill="#1a1a1a">Multi-Model Analysis</text>
                  
                  {/* Detection modules */}
                  <g>
                    <rect x="20" y="100" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="130" fontSize="24">🧠</text>
                    <text x="75" y="125" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">CLIP Visual</text>
                    <text x="75" y="142" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">Neural network analysis</text>
                  </g>
                  
                  <g>
                    <rect x="20" y="165" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="195" fontSize="24">🎨</text>
                    <text x="75" y="190" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Visual Artifacts</text>
                    <text x="75" y="207" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">Compression detection</text>
                  </g>
                  
                  <g>
                    <rect x="20" y="230" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="260" fontSize="24">🎵</text>
                    <text x="75" y="255" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Audio-Visual Sync</text>
                    <text x="75" y="272" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">Lip-sync verification</text>
                  </g>
                  
                  <g>
                    <rect x="20" y="295" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="325" fontSize="24">👁️</text>
                    <text x="75" y="320" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Blink Analysis</text>
                    <text x="75" y="337" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">Eye movement patterns</text>
                  </g>
                  
                  <g>
                    <rect x="20" y="360" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="390" fontSize="24">📝</text>
                    <text x="75" y="385" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Text Corruption</text>
                    <text x="75" y="402" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">OCR analysis</text>
                  </g>
                  
                  <g>
                    <rect x="20" y="425" width="200" height="55" rx="12" fill="#f3f4f6" stroke="url(#purpleGrad)" strokeWidth="2"/>
                    <text x="40" y="455" fontSize="24">⚡</text>
                    <text x="75" y="450" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#1a1a1a">Motion Flow</text>
                    <text x="75" y="467" fontFamily="-apple-system, sans-serif" fontSize="12" fill="#6b7280">Optical flow analysis</text>
                  </g>
                </g>

                {/* Stage 4: Score Fusion */}
                <g 
                  className={`cursor-pointer transition-all duration-300 ${activeStep === 4 ? 'filter brightness-110' : 'opacity-70'}`}
                  onClick={() => setActiveStep(4)}
                  style={{ filter: activeStep === 4 ? 'url(#glow)' : 'none' }}
                  transform="translate(880, 200)"
                >
                  <rect x="0" y="0" width="180" height="140" rx="16" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="0" width="180" height="6" rx="3" fill="url(#cyanGrad)"/>
                  
                  <text x="90" y="35" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#6b7280">STAGE 4</text>
                  <text x="90" y="70" textAnchor="middle" fontSize="36">🔄</text>
                  <text x="90" y="95" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1a1a1a">Score Fusion</text>
                  <text x="90" y="115" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">AI consensus</text>
                </g>

                {/* Stage 5: Results */}
                <g 
                  className={`cursor-pointer transition-all duration-300 ${activeStep === 5 ? 'filter brightness-110' : 'opacity-70'}`}
                  onClick={() => setActiveStep(5)}
                  style={{ filter: activeStep === 5 ? 'url(#glow)' : 'none' }}
                  transform="translate(1120, 180)"
                >
                  <rect x="0" y="0" width="200" height="180" rx="16" fill="white" filter="url(#shadow)"/>
                  <rect x="0" y="0" width="200" height="6" rx="3" fill="url(#greenGrad)"/>
                  
                  <text x="100" y="35" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#6b7280">STAGE 5</text>
                  <text x="100" y="70" textAnchor="middle" fontSize="36">✅</text>
                  <text x="100" y="95" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="18" fontWeight="600" fill="#1a1a1a">Final Results</text>
                  
                  <g opacity="0.8">
                    <text x="100" y="120" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">✓ Classification</text>
                    <text x="100" y="138" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">✓ Confidence Score</text>
                    <text x="100" y="156" textAnchor="middle" fontFamily="-apple-system, sans-serif" fontSize="13" fill="#6b7280">✓ Detection Report</text>
                  </g>
                </g>

                {/* Flow connections */}
                {/* Stage 1 to 2 */}
                <motion.path 
                  d="M 260 150 L 320 150" 
                  stroke="#667eea" 
                  strokeWidth="2" 
                  fill="none" 
                  markerEnd="url(#flowArrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: activeStep >= 2 ? 1 : 0.3,
                    opacity: activeStep >= 2 ? 0.8 : 0.3
                  }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Stage 2 to 3 */}
                <motion.path 
                  d="M 520 150 L 580 150" 
                  stroke="#667eea" 
                  strokeWidth="2" 
                  fill="none" 
                  markerEnd="url(#flowArrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: activeStep >= 3 ? 1 : 0.3,
                    opacity: activeStep >= 3 ? 0.8 : 0.3
                  }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
                
                {/* Stage 3 to 4 (multiple connections) */}
                <g>
                  <motion.path 
                    d="M 800 187 Q 840 187 860 240" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  <motion.path 
                    d="M 800 252 L 860 260" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                  />
                  <motion.path 
                    d="M 800 317 L 860 280" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                  <motion.path 
                    d="M 800 382 Q 840 382 860 300" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  />
                  <motion.path 
                    d="M 800 447 Q 840 447 860 320" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                  <motion.path 
                    d="M 800 512 Q 840 512 860 340" 
                    stroke="#667eea" 
                    strokeWidth="2" 
                    fill="none" 
                    markerEnd="url(#flowArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ 
                      pathLength: activeStep >= 4 ? 1 : 0.3,
                      opacity: activeStep >= 4 ? 0.8 : 0.3
                    }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                  />
                </g>
                
                {/* Stage 4 to 5 */}
                <motion.path 
                  d="M 1060 270 L 1120 270" 
                  stroke="#667eea" 
                  strokeWidth="2" 
                  fill="none" 
                  markerEnd="url(#flowArrow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: activeStep >= 5 ? 1 : 0.3,
                    opacity: activeStep >= 5 ? 0.8 : 0.3
                  }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                />
              </svg>
            </div>
          </motion.div>

        </div>

        {/* Enhanced Detection Methods Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-2">
              Stage 3 Breakdown
            </h3>
            <p className="text-xl md:text-2xl text-gray-600 mb-6 font-medium">
              6 Detection Methods
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {enhancedDetectionMethods.map((method, index) => (
            <motion.div
              key={index}
                className="group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index + 0.3 }}
                whileHover={{ y: -8 }}
              >
                <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                  {/* Top blue bar that appears on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  
                  {/* Icon container */}
                  <div className="relative">
                    <motion.div 
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-4xl">{method.emoji}</div>
                    </motion.div>
                    
                    {/* Title and description */}
                    <h4 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                      {method.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed mb-6 group-hover:text-gray-700 transition-colors duration-300">
                      {method.description}
                    </p>
                    
                    {/* Learn more link */}
                    {method.documentationUrl && (
                      <div className="mt-4">
                        <motion.a
                          href={method.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors group/link"
                          whileHover={{ x: 5 }}
                        >
                          <span>Learn more</span>
                          <ExternalLink className="h-4 w-4 group-hover/link:rotate-12 transition-transform" />
                        </motion.a>
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
        </motion.div>

        {/* Privacy Section */}
        <motion.div 
          className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 p-4 rounded-2xl bg-green-100">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">Your Privacy is Protected</h3>
              <p className="text-green-800 leading-relaxed">
                We do not store, save, or retain any videos or personal information you upload. All analysis is performed in real-time and your data is automatically deleted after processing. Your privacy and security are our top priority.
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Why This Matters */}
        <motion.div 
          className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-2xl p-8 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 p-4 rounded-2xl bg-primary-100">
              <AlertTriangle className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary-900 mb-3">Why This Matters</h3>
              <p className="text-primary-700 leading-relaxed">
                In an era where anyone can create convincing fake videos with free apps, protecting truth is critical. Whether you're a journalist verifying sources, a business protecting your brand, or someone concerned about impersonation - FakeCheck provides the verification layer the internet desperately needs.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Call to Action Bubble */}
        <motion.div 
          className="mt-20 relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-3xl p-12 text-center text-white shadow-2xl overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0">
              <motion.div 
                className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, 30, 0],
                  y: [0, -20, 0]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
              <motion.div 
                className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-transparent rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 0.8, 1],
                  x: [0, -20, 0],
                  y: [0, 10, 0]
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 3
                }}
              />
            </div>

            <div className="relative z-10">
              <h3 className="text-4xl md:text-5xl font-black text-white mb-8 font-display leading-tight">
                From Proof-of-Concept to Production Pipeline
              </h3>
              
              <div className="max-w-5xl mx-auto mb-12">
                <p className="text-xl md:text-2xl text-white/95 leading-relaxed font-medium mb-6">
                  FakeCheck demonstrates what's possible. Mixpeek makes it practical at-scale.
                </p>
                
                <p className="text-lg md:text-xl text-white/85 leading-relaxed font-normal">
                  Deploy sophisticated AI detection across livestreams and video uploads instantly—no infrastructure headaches, no scaling bottlenecks, just immediate protection for your business.
                </p>
              </div>
              
              <motion.a
                href="https://mixpeek.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-700 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/50 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <ExternalLink className="h-6 w-6 relative z-10" />
                <span className="relative z-10">Build Your Own</span>
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const enhancedDetectionMethods = [
  {
    title: "Neural Network Visual Analysis",
    description: "Our CLIP model analyzes visual patterns and inconsistencies by comparing frames against millions of real and synthetic faces, detecting statistical fingerprints that even the best deepfakes leave behind.",
    emoji: "🧠",
    iconBg: "bg-gradient-to-br from-purple-100 to-blue-100",
    gradientBg: "bg-gradient-to-br from-purple-500 to-blue-500",
    documentationUrl: "https://mixpeek.com/extractors/real-person-classification"
  },
  {
    title: "Visual Artifacts Detection",
    description: "Advanced AI scans for compression artifacts, warping distortions, unnatural skin textures, and flickering effects around face edges that occur when synthetic faces are blended onto real videos.",
    emoji: "🎨",
    iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
    gradientBg: "bg-gradient-to-br from-blue-500 to-indigo-500",
    documentationUrl: "https://mixpeek.com/extractors/visual-artifact-detection"
  },
  {
    title: "Audio-Visual Synchronization",
    description: "Our system extracts voiced segments and analyzes if lip movements genuinely match the spoken words. Deepfakes often show tiny delays or mismatches invisible to the human eye.",
    emoji: "🎵",
    iconBg: "bg-gradient-to-br from-yellow-100 to-orange-100",
    gradientBg: "bg-gradient-to-br from-yellow-500 to-orange-500",
    documentationUrl: "https://mixpeek.com/extractors/lipsync-analysis"
  },
  {
    title: "Eye Movement & Blink Analysis",
    description: "Humans blink 15-20 times per minute with natural variation. AI-generated faces often show robotic patterns - too perfect, too regular, or completely absent. We detect these unnatural rhythms.",
    emoji: "👁️",
    iconBg: "bg-gradient-to-br from-purple-100 to-pink-100",
    gradientBg: "bg-gradient-to-br from-purple-500 to-pink-500",
    documentationUrl: "https://mixpeek.com/extractors/blink-abnormality-detection"
  },
  {
    title: "Text Corruption Detection",
    description: "We perform OCR on video frames to detect gibberish text or corrupted characters that often appear in AI-generated content, indicating synthetic generation artifacts in the visual pipeline.",
    emoji: "📝",
    iconBg: "bg-gradient-to-br from-indigo-100 to-purple-100",
    gradientBg: "bg-gradient-to-br from-indigo-500 to-purple-500",
    documentationUrl: "https://mixpeek.com/extractors/gibberish-text-detection"
  },
  {
    title: "Motion Flow Analysis",
    description: "Optical flow analysis detects unnatural movement spikes and structural inconsistencies between frames that occur when AI tries to maintain temporal coherence in generated video sequences.",
    emoji: "⚡",
    iconBg: "bg-gradient-to-br from-green-100 to-teal-100",
    gradientBg: "bg-gradient-to-br from-green-500 to-teal-500",
    documentationUrl: "https://mixpeek.com/extractors/optical-flow-spike-detection"
  }
];