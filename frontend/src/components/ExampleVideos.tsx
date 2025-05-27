import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExampleVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

const exampleVideos: ExampleVideo[] = [
  {
    id: '1',
    title: 'AI Generated Speech',
    thumbnail: 'https://images.pexels.com/photos/7015034/pexels-photo-7015034.jpeg?auto=compress&cs=tinysrgb&w=300',
    duration: '0:15'
  },
  {
    id: '2',
    title: 'Deepfake Example',
    thumbnail: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=300',
    duration: '0:30'
  },
  {
    id: '3',
    title: 'Real Video Reference',
    thumbnail: 'https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=300',
    duration: '0:20'
  }
];

interface ExampleVideosProps {
  onSelect: (videoId: string) => void;
}

export const ExampleVideos: React.FC<ExampleVideosProps> = ({ onSelect }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Or try an example:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exampleVideos.map((video) => (
          <motion.div
            key={video.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelect(video.id)}
          >
            <div className="aspect-video relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
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