import React, { useState, useEffect } from 'react';
import { Save, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { createNewOpening, addLineToOpening, getOpenings } from './utils/openingsManager';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';

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

const OpeningUploader = () => {
  const [isNewOpening, setIsNewOpening] = useState(true);
  const [openingName, setOpeningName] = useState('');
  const [lineName, setLineName] = useState('');
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  const [positions, setPositions] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [pgn, setPgn] = useState('');
  const [isPgnParsed, setIsPgnParsed] = useState(false);
  const [openings, setOpenings] = useState([]);

  useEffect(() => {
    // Load openings from localStorage on component mount
    setOpenings(getOpenings());
  }, []);

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
    try {
      const parsedPositions = parsePGNToPositions(pgn);
      if (parsedPositions && parsedPositions.length > 0) {
        setPositions(parsedPositions);
        setIsPgnParsed(true);
      }
    } catch (error) {
      alert('Error parsing PGN: ' + error.message);
    }
  };

  const handleUpdateNotes = (notes) => {
    setPositions(prevPositions => {
      const newPositions = [...prevPositions];
      newPositions[currentPosition] = {
        ...newPositions[currentPosition],
        notes: notes
      };
      return newPositions;
    });
  };

  const handleSave = () => {
    const lineData = {
      name: lineName || 'Main Line',
      positions: positions
    };

    try {
      if (isNewOpening) {
        if (!openingName) {
          alert('Please enter an opening name');
          return;
        }
        const newOpening = createNewOpening(openingName, lineData);
        setOpenings(getOpenings());
        alert('Opening created successfully!');
      } else {
        if (!selectedOpeningId) {
          alert('Please select an opening');
          return;
        }
        const updatedOpening = addLineToOpening(selectedOpeningId, lineData);
        if (updatedOpening) {
          setOpenings(getOpenings());
          alert('Line added successfully!');
        }
      }
      resetAll();
    } catch (error) {
      alert('Error saving: ' + error.message);
    }
  };

  const resetAll = () => {
    setIsPgnParsed(false);
    setPgn('');
    setPositions([]);
    setCurrentPosition(0);
    setOpeningName('');
    setLineName('');
    setSelectedOpeningId('');
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Opening/Line Selection */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              setIsNewOpening(true);
              resetAll();
            }}
            className={`flex-1 py-2 rounded-lg ${
              isNewOpening ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            New Opening
          </button>
          <button
            onClick={() => {
              setIsNewOpening(false);
              resetAll();
            }}
            className={`flex-1 py-2 rounded-lg ${
              !isNewOpening ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Add Line to Existing
          </button>
        </div>

        {isNewOpening ? (
          <input
            type="text"
            value={openingName}
            onChange={(e) => setOpeningName(e.target.value)}
            placeholder="Opening Name"
            className="w-full p-3 border rounded-lg mb-4"
            required
          />
        ) : (
          <select
            value={selectedOpeningId}
            onChange={(e) => setSelectedOpeningId(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            required
          >
            <option value="">Select Opening</option>
            {openings.map(opening => (
              <option key={opening.id} value={opening.id}>
                {opening.name}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={lineName}
          onChange={(e) => setLineName(e.target.value)}
          placeholder={isNewOpening ? "Main Line Name" : "New Line Name"}
          className="w-full p-3 border rounded-lg"
          required
        />
      </div>

      {/* PGN Input Section - only shown before parsing */}
      {!isPgnParsed && (
        <form onSubmit={handlePGNSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste PGN
            </label>
            <textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg font-mono"
              placeholder="Paste your PGN here..."
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Parse PGN
          </button>
        </form>
      )}

      {/* Position Review Section - only shown after parsing */}
      {isPgnParsed && positions.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ChessBoard
                fen={positions[currentPosition].fen}
                size="full"
              />
              {/* Navigation controls */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setCurrentPosition(prev => Math.max(0, prev - 1))}
                  disabled={currentPosition === 0}
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="py-2">
                  Move {currentPosition + 1} of {positions.length}
                </span>
                <button
                  onClick={() => setCurrentPosition(prev => Math.min(positions.length - 1, prev + 1))}
                  disabled={currentPosition === positions.length - 1}
                  className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move: {positions[currentPosition].move}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes for this position
                </label>
                <textarea
                  value={positions[currentPosition].notes || ''}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  className="w-full h-48 p-3 border rounded-lg"
                  placeholder="Add notes for this position..."
                />
              </div>

              {/* Position list with notes preview */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">All Moves:</h3>
                <div className="max-h-48 overflow-y-auto">
                  {positions.map((pos, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentPosition(index)}
                      className={`
                        p-2 cursor-pointer
                        ${currentPosition === index ? 'bg-blue-100' : 'hover:bg-gray-100'}
                      `}
                    >
                      <div className="font-medium">{pos.move}</div>
                      {pos.notes && (
                        <div className="text-sm text-gray-600 truncate">
                          {pos.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save {isNewOpening ? 'Opening' : 'Line'}
          </button>
        </div>
      )}
    </div>
  );


};

export default OpeningUploader;
