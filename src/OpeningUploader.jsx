import React, { useState, useEffect } from 'react';
import { Save, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { createNewOpening, addLineToOpening, getOpenings, updateOpeningNotes } from './utils/openingsManager';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';

const OpeningUploader = () => {

  const [isNewOpening, setIsNewOpening] = useState(true);
  const [openingName, setOpeningName] = useState('');
  const [lineName, setLineName] = useState('');
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  const [positions, setPositions] = useState([]);
  const [notes, setNotes] = useState({}); // New state for notes
  const [existingNotes, setExistingNotes] = useState({}); // Track existing notes
  const [modifiedNotes, setModifiedNotes] = useState({}); // Track which notes were modified
  const [currentPosition, setCurrentPosition] = useState(0);
  const [pgn, setPgn] = useState('');
  const [isPgnParsed, setIsPgnParsed] = useState(false);
  const [openings, setOpenings] = useState([]);

  useEffect(() => {
    // Load openings from localStorage on component mount
    setOpenings(getOpenings());
  }, []);

  // When selecting an existing opening, load its notes
  useEffect(() => {
    if (!isNewOpening && selectedOpeningId) {
      const opening = openings.find(op => op.id === selectedOpeningId);
      if (opening) {
        setExistingNotes(opening.notes || {});
        // Pre-populate notes with existing content
        const existingNoteContent = {};
        Object.entries(opening.notes || {}).forEach(([fen, noteData]) => {
          existingNoteContent[fen] = noteData.content;
        });
        setNotes(existingNoteContent);
        setModifiedNotes({}); // Reset modified notes tracking
      }
    } else {
      setExistingNotes({});
      setNotes({});
      setModifiedNotes({});
    }
  }, [isNewOpening, selectedOpeningId, openings]);

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

        // If adding to existing opening, pre-populate notes for matching positions
        if (!isNewOpening && selectedOpeningId) {
          const opening = openings.find(op => op.id === selectedOpeningId);
          if (opening) {
            const existingNoteContent = {};
            parsedPositions.forEach(pos => {
              if (opening.notes?.[pos.fen]) {
                existingNoteContent[pos.fen] = opening.notes[pos.fen].content;
              }
            });
            setNotes(existingNoteContent);
          }
        }
      }
    } catch (error) {
      alert('Error parsing PGN: ' + error.message);
    }
  };

  const handleUpdateNotes = (noteContent) => {
    const currentFen = positions[currentPosition].fen;
    setNotes(prevNotes => ({
      ...prevNotes,
      [currentFen]: noteContent
    }));
    setModifiedNotes(prev => ({
      ...prev,
      [currentFen]: true
    }));
  };

  const handleSave = () => {
    // Prepare notes object combining existing and modified notes
    const notesObject = {};

    // Include existing notes that weren't modified
    Object.entries(existingNotes).forEach(([fen, noteData]) => {
      if (!modifiedNotes[fen]) {
        notesObject[fen] = noteData;
      }
    });

    // Add new and modified notes
    Object.entries(notes).forEach(([fen, content]) => {
      if (content?.trim() && modifiedNotes[fen]) {
        notesObject[fen] = {
          id: existingNotes[fen]?.id || crypto.randomUUID(),
          content: content.trim(),
          referencedBy: existingNotes[fen]?.referencedBy || []
        };
      }
    });

    const lineData = {
      name: lineName || 'Main Line',
      positions: positions.map(pos => ({
        fen: pos.fen,
        move: pos.move,
        from: pos.from,
        to: pos.to
      }))
    };

    try {
      if (isNewOpening) {
        if (!openingName) {
          alert('Please enter an opening name');
          return;
        }
        createNewOpening(openingName, {
          line: lineData,
          notes: notesObject
        });
      } else {
        if (!selectedOpeningId) {
          alert('Please select an opening');
          return;
        }
        addLineToOpening(selectedOpeningId, {
          line: lineData,
          notes: notesObject
        });
      }
      setOpenings(getOpenings());
      alert(`${isNewOpening ? 'Opening created' : 'Line added'} successfully!`);
      resetAll();
    } catch (error) {
      alert('Error saving: ' + error.message);
    }
  };

  const resetAll = () => {
    setIsPgnParsed(false);
    setPgn('');
    setPositions([]);
    setNotes({});
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

      {/* Position Review Section - modified to use new notes structure */}
      {isPgnParsed && positions.length > 0 && (
        <div className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ChessBoard
                fen={positions[currentPosition].fen}
                size="full"
              />
              {/* ... Navigation controls remain the same ... */}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move: {positions[currentPosition].move}
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes for this position
                  </label>
                  {existingNotes[positions[currentPosition].fen] && (
                    <span className="text-sm text-gray-500">
                      {modifiedNotes[positions[currentPosition].fen]
                       ? "Modified from existing note"
                       : "Existing note"}
                    </span>
                  )}
                </div>
                <textarea
                  value={notes[positions[currentPosition].fen] || ''}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  className={`w-full h-48 p-3 border rounded-lg ${
                    modifiedNotes[positions[currentPosition].fen]
                      ? 'border-blue-500'
                      : existingNotes[positions[currentPosition].fen]
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-300'
                  }`}
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
                      {notes[pos.fen] && (
                        <div className="text-sm text-gray-600 truncate">
                          {notes[pos.fen]}
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
