import React from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { DetectionResult } from './components/DetectionResult';
import { ResultsSkeleton } from './components/ui/ResultsSkeleton';
import { HistorySection } from './components/HistorySection';
import { InfoSection } from './components/InfoSection';
import { Footer } from './components/Footer';
import { useVideoDetection } from './hooks/useVideoDetection';

function App() {
  const {
    currentVideo,
    history,
    isProcessing,
    processingStages,
    currentStageIndex,
    simulatedProgress,
    estimatedTimeRemaining,
    handleFileSelect,
    resetCurrentVideo
  } = useVideoDetection();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Enhanced Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 py-12 lg:py-16 overflow-hidden">
          {/* Enhanced Background decoration */}
          <div className="absolute inset-0">
            {/* Main gradient orbs */}
            <motion.div 
              className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary-400/30 to-blue-400/30 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, -30, 0]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute bottom-20 right-10 w-[32rem] h-[32rem] bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 0.8, 1],
                x: [0, -40, 0],
                y: [0, 20, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div 
              className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-indigo-400/20 to-cyan-400/20 rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"
              animate={{ 
                scale: [1, 1.5, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity, 
                ease: "linear"
              }}
            />
            
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -100, -20],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            {/* Grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
                             <motion.div
                 className="mb-4"
                 initial={{ scale: 0.8 }}
                 animate={{ scale: 1 }}
                 transition={{ duration: 0.8, delay: 0.2 }}
               >
                 <motion.div 
                   className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary-100 to-blue-100 border border-primary-200 mb-6"
                  whileHover={{ scale: 1.05 }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ 
                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.2 }
                  }}
                >
                  <span className="text-sm font-bold text-primary-700">🎯 AI-Powered Detection</span>
                  <motion.div
                    className="ml-2 w-2 h-2 bg-primary-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </motion.div>

                             <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 leading-tight mb-8">
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  Spot{' '}
                </motion.span>
                <motion.span 
                  className="text-gradient-primary relative"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  AI-Generated
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-primary-400/20 to-blue-400/20 rounded-lg blur-xl"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                >
                  Videos in{' '}
                </motion.span>
                <motion.span 
                  className="text-gradient-secondary relative"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                >
                  Seconds
                  <motion.div
                    className="absolute -inset-2 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  />
                </motion.span>
              </h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="max-w-5xl mx-auto"
              >
                <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 leading-relaxed font-medium mb-12">
                  Our advanced detection system combines{' '}
                  <motion.span 
                    className="text-primary-600 font-bold relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    visual artifact detection
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 1.3 }}
                    />
                  </motion.span>
                  ,{' '}
                  <motion.span 
                    className="text-blue-600 font-bold relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    audio-visual synchronization
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 1.5 }}
                    />
                  </motion.span>
                  ,{' '}
                  <motion.span 
                    className="text-purple-600 font-bold relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    text corruption analysis
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 1.7 }}
                    />
                  </motion.span>
                                     {' '}and{' '}
                  <motion.span 
                    className="text-indigo-600 font-bold relative"
                    whileHover={{ scale: 1.05 }}
                  >
                    motion flow detection
                    <motion.div
                      className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.6, delay: 1.9 }}
                    />
                  </motion.span>
                  {' '}to verify video authenticity with scientific precision.
                </p>

                {/* Call-to-action buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.1 }}
                >
                  <motion.button
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10">Try It Now</span>
                  </motion.button>
                  
                  <motion.a
                    href="#how-it-works"
                    className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-300 hover:border-primary-400 hover:text-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn How It Works
                  </motion.a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Enhanced Upload Section */}
        <section id="upload-section" className="bg-gradient-to-br from-gray-100 via-white to-gray-100 py-20 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6">
                  Upload Video for{' '}
                  <span className="text-gradient-primary">Analysis</span>
                </h2>
                <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
                  Upload any video to see our detection in action. We'll analyze it across multiple dimensions and show you exactly what we found.
                </p>
              </div>
              
              <UploadSection
                currentVideo={currentVideo}
                onFileSelect={handleFileSelect}
                onReset={resetCurrentVideo}
                isProcessing={isProcessing}
                processingStages={processingStages}
                currentStageIndex={currentStageIndex}
                simulatedProgress={simulatedProgress}
                estimatedTimeRemaining={estimatedTimeRemaining}
              />
            </motion.div>
          </div>
        </section>

        {/* Enhanced Processing Preview Section */}
        {currentVideo?.status === 'processing' && (
          <section className="bg-white py-20 lg:py-24 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center mb-12">
                  <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Analysis in{' '}
                    <span className="text-gradient-primary">Progress</span>
                  </h2>
                  <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                    Your detailed results will appear here once analysis is complete
                  </p>
                </div>
                <ResultsSkeleton />
              </motion.div>
            </div>
          </section>
        )}

        {/* Enhanced Results Section */}
        {currentVideo?.status === 'completed' && currentVideo.result && (
          <section className="bg-white py-20 lg:py-24 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center mb-12">
                  <h2 className="font-display text-3xl md:text-4xl font-black text-gray-900 mb-6">
                    Analysis{' '}
                    <span className="text-gradient-success">Complete</span>
                  </h2>
                  <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                    Comprehensive deepfake detection results
                  </p>
                </div>
                <DetectionResult 
                  result={currentVideo.result} 
                  videoUrl={currentVideo.thumbnailUrl}
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* Enhanced History Section */}
        {history.length > 0 && (
          <section className="bg-gradient-to-br from-gray-50 to-white py-20 lg:py-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <HistorySection history={history} />
            </div>
          </section>
        )}

        {/* Info Section */}
        <InfoSection />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;