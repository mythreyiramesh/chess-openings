import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Trash2, Download, Upload } from 'lucide-react';
import { getOpenings, deleteOpening, exportOpenings, importOpenings } from './utils/openingsManager';
import ChessBoard from './ChessBoard';

const ChessStudyTool = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    loadOpenings();
  }, []);

  useEffect(() => {
    if (selectedOpeningId) {
      const opening = openings.find(op => op.id === selectedOpeningId);
      if (opening && opening.lines.length > 0) {
        setSelectedLineId(opening.lines[0].id);
        setCurrentPosition(0);
      }
    }
  }, [selectedOpeningId]);

  const loadOpenings = () => {
    const savedOpenings = getOpenings();
    setOpenings(savedOpenings);
    if (savedOpenings.length > 0) {
      setSelectedOpeningId(savedOpenings[0].id);
      if (savedOpenings[0].lines.length > 0) {
        setSelectedLineId(savedOpenings[0].lines[0].id);
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this opening?')) {
      const remainingOpenings = deleteOpening(id);
      setOpenings(remainingOpenings);
      if (selectedOpeningId === id) {
        setSelectedOpeningId(remainingOpenings[0]?.id || null);
        setSelectedLineId(remainingOpenings[0]?.lines[0]?.id || null);
        setCurrentPosition(0);
      }
    }
  };

  const handleExport = () => {
    exportOpenings();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      const importedOpenings = await importOpenings(file);
      setOpenings(importedOpenings);
      if (importedOpenings.length > 0) {
        setSelectedOpeningId(importedOpenings[0].id);
        setSelectedLineId(importedOpenings[0].lines[0]?.id || null);
        setCurrentPosition(0);
      }
      e.target.value = '';
    } catch (err) {
      setError(err.message);
      e.target.value = '';
    }
  };

  const selectedOpening = openings.find(op => op.id === selectedOpeningId);
  const selectedLine = selectedOpening?.lines.find(line => line.id === selectedLineId);
  const goToNextMove = () => {
    if (selectedLine && currentPosition < selectedLine.positions.length - 1) {
      setCurrentPosition(currentPosition + 1);
    }
  };

  const goToPreviousMove = () => {
    if (currentPosition > 0) {
      setCurrentPosition(currentPosition - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-100 min-h-screen">
      {/* Controls Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedOpeningId || ''}
              onChange={(e) => {
                setSelectedOpeningId(e.target.value);
                setCurrentPosition(0);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select an opening</option>
              {openings.map(opening => (
                <option key={opening.id} value={opening.id}>
                  {opening.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            {openings.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            {selectedOpeningId && (
              <button
                onClick={() => handleDelete(selectedOpeningId)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {selectedOpening && (
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedLineId || ''}
              onChange={(e) => {
                setSelectedLineId(e.target.value);
                setCurrentPosition(0);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a line</option>
              {selectedOpening.lines.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!selectedLine ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {openings.length === 0
              ? "No openings available. Import openings to get started."
              : "Please select an opening and line from the dropdowns above."}
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            {selectedOpening.name} - {selectedLine.name}
          </h1>

          <div className="mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedLine.positions[currentPosition].notes || ''}
                </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chess Board */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="w-full aspect-square bg-gray-100 rounded-lg">
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <ChessBoard
                      fen={selectedLine.positions[currentPosition].fen}
                      size="full"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={goToPreviousMove}
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentPosition === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="py-2">
                  Move {currentPosition + 1} of {selectedLine.positions.length}
                </span>
                <button
                  onClick={goToNextMove}
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentPosition === selectedLine.positions.length - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">Move List</h2>
                <div className="space-y-2">
                  {selectedLine.positions.map((position, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentPosition(index)}
                      className={`
                        p-2 rounded cursor-pointer
                        ${currentPosition === index ? 'bg-blue-100' : 'hover:bg-gray-100'}
                      `}
                    >
                      <div className="font-medium">{position.move}</div>
                      {position.notes && (
                        <div className="text-sm text-gray-600 truncate">
                          {position.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChessStudyTool;
