import React, { useState } from 'react';
import ChessStudyTool from './ChessStudyTool';
import OpeningUploader from './OpeningUploader';
import OpeningTree from './OpeningTree';
import OpeningsList from './OpeningsList';
import { BookOpen, Upload, Network, List } from 'lucide-react';

const OpeningManager = () => {
  const [state, setState] = useState({
    mode: 'list',
    selectedOpeningId: null,
    selectedLineId: null
  });

  const handleReview = (openingId, lineId) => {
    setState({
      mode: 'review',
      selectedOpeningId: openingId,
      selectedLineId: lineId
    });
  };

  const handleModeChange = (newMode) => {
    setState(prev => ({
      ...prev,
      mode: newMode,
      selectedOpeningId: newMode === 'review' ? prev.selectedOpeningId : null,
      selectedLineId: newMode === 'review' ? prev.selectedLineId : null
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex space-x-4">
              <button
                onClick={() => handleModeChange('list')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  state.mode === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <List className="w-5 h-5 mr-2" />
                Opening List
              </button>
              <button
                onClick={() => handleModeChange('upload')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  state.mode === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                Load/Add Openings
              </button>
              <button
                onClick={() => handleModeChange('review')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  state.mode === 'review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Review Openings
              </button>
              <button
                onClick={() => handleModeChange('tree')}
                className={`inline-flex items-center px-4 py-2 border-b-2 ${
                  state.mode === 'tree'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Network className="w-5 h-5 mr-2" />
                Tree View
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4">
        {state.mode === 'review' && (
          <ChessStudyTool
            initialOpeningId={state.selectedOpeningId}
            initialLineId={state.selectedLineId}
          />
        )}
        {state.mode === 'upload' && <OpeningUploader />}
        {state.mode === 'tree' && <OpeningTree />}
        {state.mode === 'list' && (
          <OpeningsList onReview={handleReview} />
        )}
      </main>
    </div>
  );
};

export default OpeningManager;

