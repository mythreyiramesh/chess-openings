import React, { useState } from 'react';
import ChessStudyTool from './ChessStudyTool';
import OpeningUploader from './OpeningUploader';
import { BookOpen, Upload } from 'lucide-react';

const OpeningManager = () => {
  const [mode, setMode] = useState('review'); // 'review' | 'upload'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex space-x-4">
              <button
                onClick={() => setMode('review')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  mode === 'review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Openings
              </button>
              <button
                onClick={() => setMode('upload')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  mode === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Opening
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4">
        {mode === 'review' ? <ChessStudyTool /> : <OpeningUploader />}
      </main>
    </div>
  );
};

export default OpeningManager;
