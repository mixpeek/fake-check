import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialTab = 'signin' }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (activeTab === 'signin') {
        await login({ username: email, password });
      } else {
        await signup({ email, password });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-6 w-6" />
        </button>
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('signin')}
            className={cn(
              "flex-1 py-2 text-center font-medium",
              activeTab === 'signin' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={cn(
              "flex-1 py-2 text-center font-medium",
              activeTab === 'signup' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
            )}
          >
            Sign Up
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-4">
          {activeTab === 'signin' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>
          <div className="mt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 