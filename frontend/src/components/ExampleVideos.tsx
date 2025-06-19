import React from 'react';
import { Play, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExampleVideo {
  id: string;
  title: string;
  path: string;
  thumbnail: string;
  duration: string;
  type: 'fake' | 'real';
}

const exampleVideos: ExampleVideo[] = [
  {
    id: '1',
    title: 'AI Generated Video',
    path: '/videos/example-1.mp4',
    thumbnail: '/videos/example-1.mp4',
    duration: '0:15',
    type: 'fake'
  },
  {
    id: '2',
    title: 'Deepfake Video',
    path: '/videos/example-2.mp4',
    thumbnail: '/videos/example-2.mp4',
    duration: '0:30',
    type: 'fake'
  },
  {
    id: '3',
    title: 'Real Video',
    path: '/videos/example-3.mp4',
    thumbnail: '/videos/example-3.mp4',
    duration: '0:20',
    type: 'real'
  }
];

interface ExampleVideosProps {
  onSelect: (file: File) => void;
}

export const ExampleVideos: React.FC<ExampleVideosProps> = ({ onSelect }) => {
  const handleVideoSelect = async (video: ExampleVideo) => {
    try {
      const response = await fetch(video.path);
      const blob = await response.blob();
      const file = new File([blob], video.path.split('/').pop() || `example-${video.id}.mp4`, { type: 'video/mp4' });
      onSelect(file);
    } catch (error) {
      console.error('Error loading example video:', error);
    }
  };

  return (
    <div className="mt-16">
      {/* Divider */}
      <div className="relative mb-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-6 py-2 text-sm font-medium text-gray-500 rounded-full border border-gray-200">
            or
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mb-12"
      >
        <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 font-display">
          Try an{' '}
          <span className="text-gradient-primary">example</span>
        </h3>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
          Test our detection system with these sample videos to see how it identifies different types of content
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {exampleVideos.map((video, index) => (
          <motion.div
            key={video.id}
            className="group cursor-pointer"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index + 0.3 }}
            whileHover={{ y: -8 }}
            onClick={() => handleVideoSelect(video)}
          >
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:shadow-xl">
              {/* Video Thumbnail */}
              <div className="aspect-video relative bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                <video
                  src={video.path}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  preload="auto"
                />
                
                {/* Overlay with play button */}
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="absolute inset-0 bg-white rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative rounded-full bg-white bg-opacity-95 group-hover:bg-opacity-100 p-4 shadow-lg transition-all duration-300">
                      <Play className="w-8 h-8 text-primary-600 ml-1" />
                    </div>
                  </motion.div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="w-3 h-3" />
                  {video.duration}
                </div>

                {/* Type indicator */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  video.type === 'fake' 
                    ? 'bg-red-500 bg-opacity-90 text-white' 
                    : 'bg-green-500 bg-opacity-90 text-white'
                }`}>
                  {video.type === 'fake' && <Sparkles className="w-3 h-3" />}
                  {video.type === 'fake' ? 'AI Generated' : 'Authentic'}
                </div>
              </div>

              {/* Card content */}
              <div className="p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {video.title}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {video.type === 'fake' 
                    ? 'Test our AI detection on this synthetic content'
                    : 'Verify authenticity with this real video sample'
                  }
                </p>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Click to analyze
                  </span>
                  <motion.div
                    className="w-2 h-2 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>

              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center mt-12"
      >
        <p className="text-sm text-gray-500 italic">
          Each video tests different aspects of our detection system
        </p>
      </motion.div>
    </div>
  );
};