import React, { useState } from 'react';
import ChessStudyTool from './ChessStudyTool';
import OpeningUploader from './OpeningUploader';
import OpeningTree from './OpeningTree';
import OpeningsList from './OpeningsList';
import { Menu, Transition } from '@headlessui/react';
import { BookOpen, Upload, Network, List, Menu as MenuIcon } from 'lucide-react';

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

  const navItems = [
    { mode: 'list', icon: List, label: 'Opening List' },
    { mode: 'upload', icon: Upload, label: 'Load/Add Openings' },
    { mode: 'review', icon: BookOpen, label: 'Review Openings' },
    { mode: 'tree', icon: Network, label: 'Tree View' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              {navItems.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`inline-flex items-center px-4 py-2 border-b-2 ${
                    state.mode === mode
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <Menu as="div" className="relative">
                <Menu.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                  <MenuIcon className="h-6 w-6" />
                </Menu.Button>

                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1">
                      {navItems.map(({ mode, icon: Icon, label }) => (
                        <Menu.Item key={mode}>
                          {({ active }) => (
                            <button
                              onClick={() => handleModeChange(mode)}
                              className={`${
                                active ? 'bg-blue-500 text-white' : 'text-gray-900'
                              } ${
                                state.mode === mode ? 'bg-blue-50' : ''
                              } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            >
                              <Icon className="w-5 h-5 mr-2" />
                              {label}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
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
