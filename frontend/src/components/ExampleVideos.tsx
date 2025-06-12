import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExampleVideo {
  id: string;
  title: string;
  path: string;
  thumbnail: string;
  duration: string;
}

const exampleVideos: ExampleVideo[] = [
  {
    id: '1',
    title: 'AI Generated Speech',
    path: '/videos/example-1.mp4',
    thumbnail: '/videos/example-1.mp4',
    duration: '0:15'
  },
  {
    id: '2',
    title: 'Deepfake Example',
    path: '/videos/example-2.mp4',
    thumbnail: '/videos/example-2.mp4',
    duration: '0:30'
  },
  {
    id: '3',
    title: 'Real Video Reference',
    path: '/videos/example-3.mp4',
    thumbnail: '/videos/example-3.mp4',
    duration: '0:20'
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
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Or try an example:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exampleVideos.map((video) => (
          <motion.div
            key={video.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            onClick={() => handleVideoSelect(video)}
          >
            <div className="aspect-video relative bg-gray-900">
              <video
                src={video.path}
                className="w-full h-full object-cover opacity-80"
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <div className="rounded-full bg-white bg-opacity-90 p-3 transform group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-3 bg-white">
              <h4 className="font-medium text-gray-900">{video.title}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};