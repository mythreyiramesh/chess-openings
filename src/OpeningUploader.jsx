import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Chess } from 'chess.js';
import { saveOpening } from './utils/openingsManager.js';
import ChessBoard from './ChessBoard';

const MovesList = ({ positions, currentPosition }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Moves:</h3>
      <div className="space-y-1">
        {positions.slice(1, currentPosition + 1).map((pos, idx) => (
          <span key={idx} className="inline-block">
            {idx % 2 === 0 && (
              <span className="text-gray-500 mr-1">
                {Math.floor(idx / 2) + 1}.
              </span>
            )}
            <span className={`mr-2 ${idx === currentPosition - 1 ? 'font-bold text-blue-600' : ''}`}>
              {pos.move}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

const OpeningUploader = ({ onSaveComplete }) => {
  const [currentStep, setCurrentStep] = useState('upload');
  const [pgn, setPgn] = useState('');
  const [positions, setPositions] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [openingName, setOpeningName] = useState('');
  const [error, setError] = useState('');

const parsePGNToPositions = (pgnText) => {
  try {
    const chess = new Chess();

    // Clean up the PGN text
    const cleanPGN = pgnText
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\([^)]*\)/g, '') // Remove variations
      .replace(/\d+\s*\./g, '') // Remove move numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // If PGN contains header tags, handle them separately
    let moves = cleanPGN;
    if (moves.includes('[')) {
      moves = moves.split('\n\n').slice(-1)[0].trim();
    }

    // Try to make the moves
    const movesList = moves.split(' ').filter(move => move.length > 0);
    chess.reset();

    const positions = [{
      fen: chess.fen(),
      move: 'Starting Position',
      san: '',
      notes: '',
      moveNumber: 0
    }];

    for (const move of movesList) {
      try {
        const moveResult = chess.move(move, { sloppy: true });
        if (moveResult) {
          positions.push({
            fen: chess.fen(),
            move: moveResult.san,
            from: moveResult.from,
            to: moveResult.to,
            notes: '',
            moveNumber: Math.floor(positions.length / 2)
          });
        }
      } catch (moveError) {
        console.warn('Invalid move:', move);
        continue;
      }
    }

    if (positions.length === 1) {
      throw new Error('No valid moves found in PGN');
    }

    return positions;
  } catch (err) {
    console.error('PGN parsing error:', err);
    throw new Error(`Error parsing PGN: ${err.message}`);
  }
};

  const handlePGNSubmit = (e) => {
    e.preventDefault();
    setError('');

    const parsedPositions = parsePGNToPositions(pgn);
    if (parsedPositions) {
      setPositions(parsedPositions);
      setCurrentStep('notes');
    }
  };

  const handleUpdateNotes = (notes) => {
    setPositions(prevPositions => {
      const newPositions = [...prevPositions];
      newPositions[currentPosition] = {
        ...newPositions[currentPosition],
        notes
      };
      return newPositions;
    });
  };

  const handleSave = () => {
    const openingData = {
      id: Date.now().toString(),
      name: openingName,
      positions: positions,
      dateAdded: new Date().toISOString()
    };

    try {
      saveOpening(openingData);
      alert('Opening saved successfully!');
      // Reset form or redirect
      setCurrentStep('upload');
      setPgn('');
      setOpeningName('');
      setPositions([]);
      if (onSaveComplete) onSaveComplete();
    } catch (error) {
      alert('Error saving opening: ' + error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {currentStep === 'upload' ? (
        <form onSubmit={handlePGNSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Name
            </label>
            <input
              type="text"
              value={openingName}
              onChange={(e) => setOpeningName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste PGN
            </label>
            <textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              className="w-full h-64 p-3 border rounded-lg font-mono"
              placeholder="Paste your PGN here..."
              required
            />
            {error && (
              <p className="mt-2 text-red-500 text-sm">{error}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Parse PGN and Add Notes
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{openingName}</h2>

                         {/* Add MovesList component here */}
              <MovesList
                positions={positions}
                currentPosition={currentPosition}
              />

          {/* Position Display and Chessboard */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">

              <ChessBoard
      fen={positions[currentPosition].fen}
      size="fixed" // or "full" depending on your preference
    />

              <div className="text-center">
                {currentPosition > 0 && (
                  <div className="text-lg font-semibold">
                    Move {Math.ceil(currentPosition / 2)}: {positions[currentPosition].move}
                  </div>
                )}
              </div>

            </div>

            <div className="space-y-4">
              {/* Notes for current position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentPosition === 0 ? 'Opening Notes' :
                   currentPosition === positions.length - 1 ? 'Final Position Notes' :
                   `Notes for Move ${Math.ceil(currentPosition / 2)}`}
                </label>
                <textarea
                  value={positions[currentPosition].notes}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  className="w-full h-48 p-3 border rounded-lg"
                  placeholder="Add notes for this position..."
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPosition(Math.max(0, currentPosition - 1))}
              disabled={currentPosition === 0}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="py-2 min-w-[100px] text-center">
              Position {currentPosition} of {positions.length - 1}
            </span>
            <button
              onClick={() => setCurrentPosition(Math.min(positions.length - 1, currentPosition + 1))}
              disabled={currentPosition === positions.length - 1}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Opening
          </button>
        </div>
      )}
    </div>
  );
};

export default OpeningUploader;
