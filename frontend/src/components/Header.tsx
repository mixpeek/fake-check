import React, { useState } from 'react';
import { ScanFace, Github, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { Button } from './ui/Button';

export const Header: React.FC = () => {
  const [authModal, setAuthModal] = useState({ isOpen: false, initialTab: 'signin' as 'signin' | 'signup' });
  const { isAuthenticated, user, logout } = useAuth();

  const openModal = (tab: 'signin' | 'signup') => {
    setAuthModal({ isOpen: true, initialTab: tab });
  };

  const closeModal = () => {
    setAuthModal({ isOpen: false, initialTab: 'signin' });
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <ScanFace className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">FakeCheck</span>
            <nav className="hidden md:flex items-center space-x-6 ml-6">
              <a
                href="#how-it-works"
                className="text-gray-500 hover:text-gray-900 text-sm font-medium"
              >
                How It Works
              </a>
              <a
                href="https://github.com/mixpeek/fake-check"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                <Github className="h-5 w-5" />
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{user.email}</span>
                  <span className="ml-2 text-gray-400">
                    ({user.usage_count} / 5 analyses used)
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openModal('signin')} leftIcon={<LogIn className="h-4 w-4" />}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => openModal('signup')} leftIcon={<UserPlus className="h-4 w-4" />}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {authModal.isOpen && <AuthModal onClose={closeModal} initialTab={authModal.initialTab} />}
    </header>
  );
};