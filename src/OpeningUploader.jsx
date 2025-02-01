import React, { useState, useEffect } from 'react';
import { Save, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { createNewOpening, addLineToOpening, getOpenings, updateOpeningNotes } from './utils/openingsManager';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';

const OpeningUploader = () => {
  const [mode, setMode] = useState('new'); // 'new', 'add', or 'modify'
  const [openingName, setOpeningName] = useState('');
  const [lineName, setLineName] = useState('');
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [positions, setPositions] = useState([]);
  const [notes, setNotes] = useState({});
  const [existingNotes, setExistingNotes] = useState({});
  const [modifiedNotes, setModifiedNotes] = useState({});
  const [currentPosition, setCurrentPosition] = useState(0);
  const [pgn, setPgn] = useState('');
  const [isPgnParsed, setIsPgnParsed] = useState(false);
  const [openings, setOpenings] = useState([]);

  useEffect(() => {
    // Load openings from localStorage on component mount
    setOpenings(getOpenings());
  }, []);

  // Reset states when mode changes
  useEffect(() => {
    resetAll();
  }, [mode]);

  // Load existing notes when opening/line is selected in modify mode
  useEffect(() => {
    if (mode === 'modify' && selectedOpeningId && selectedLineId) {
      const opening = openings.find(op => op.id === selectedOpeningId);
      const line = opening?.lines.find(l => l.id === selectedLineId);

      if (opening && line) {
        setPositions(line.positions);
        setExistingNotes(opening.notes || {});
        const existingNoteContent = {};
        Object.entries(opening.notes || {}).forEach(([fen, noteData]) => {
          existingNoteContent[fen] = noteData.content;
        });
        setNotes(existingNoteContent);
        setModifiedNotes({});
        setIsPgnParsed(true);
        setCurrentPosition(0);
      }
    }
  }, [mode, selectedOpeningId, selectedLineId, openings]);

  // Effect to handle loading existing notes when opening is selected (for 'add' mode)
  useEffect(() => {
    if (mode === 'add' && selectedOpeningId) {
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
    } else if (mode === 'new') {
      setExistingNotes({});
      setNotes({});
      setModifiedNotes({});
    }
  }, [mode, selectedOpeningId, openings]);

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
        if (mode === 'add' && selectedOpeningId) {
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

    try {
      if (mode === 'modify') {
        if (!selectedOpeningId || !selectedLineId) {
          alert('Please select an opening and line');
          return;
        }
        updateOpeningNotes(selectedOpeningId, notesObject);
        alert('Notes updated successfully!');
      } else {
        const lineData = {
          name: lineName || 'Main Line',
          positions: positions.map(pos => ({
            fen: pos.fen,
            move: pos.move,
            from: pos.from,
            to: pos.to
          }))
        };

        if (mode === 'new') {
          if (!openingName) {
            alert('Please enter an opening name');
            return;
          }
          createNewOpening(openingName, {
            line: lineData,
            notes: notesObject
          });
          alert('Opening created successfully!');
        } else { // mode === 'add'
          if (!selectedOpeningId) {
            alert('Please select an opening');
            return;
          }
          addLineToOpening(selectedOpeningId, {
            line: lineData,
            notes: notesObject
          });
          alert('Line added successfully!');
        }
      }

      setOpenings(getOpenings());
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
    setExistingNotes({});
    setModifiedNotes({});
    setCurrentPosition(0);
    setOpeningName('');
    setLineName('');
    setSelectedOpeningId('');
    setSelectedLineId('');
  };

return (
  <div className="max-w-4xl mx-auto p-4">
    {/* Mode Selection */}
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => setMode('new')}
        className={`flex-1 py-2 rounded-lg ${
          mode === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        New Opening
      </button>
      <button
        onClick={() => setMode('add')}
        className={`flex-1 py-2 rounded-lg ${
          mode === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Add Line
      </button>
      <button
        onClick={() => setMode('modify')}
        className={`flex-1 py-2 rounded-lg ${
          mode === 'modify' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Modify Notes
      </button>
    </div>

    {/* Opening/Line Selection */}
    <div className="space-y-4 mb-6">
      {mode === 'new' ? (
        <input
          type="text"
          value={openingName}
          onChange={(e) => setOpeningName(e.target.value)}
          placeholder="Opening Name"
          className="w-full p-3 border rounded-lg"
        />
      ) : (
        <>
          <select
            value={selectedOpeningId}
            onChange={(e) => setSelectedOpeningId(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Select Opening</option>
            {openings.map(opening => (
              <option key={opening.id} value={opening.id}>
                {opening.name}
              </option>
            ))}
          </select>

          {mode === 'modify' && selectedOpeningId && (
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Select Line</option>
              {openings
                .find(op => op.id === selectedOpeningId)
                ?.lines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
            </select>
          )}
        </>
      )}

      {mode !== 'modify' && (
        <input
          type="text"
          value={lineName}
          onChange={(e) => setLineName(e.target.value)}
          placeholder="Line Name"
          className="w-full p-3 border rounded-lg"
        />
      )}
    </div>

    {/* PGN Input - only show for new/add modes */}
    {mode !== 'modify' && !isPgnParsed && (
      <form onSubmit={handlePGNSubmit} className="space-y-4">
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

    {/* Position Review Section */}
    {isPgnParsed && positions.length > 0 && (
      <div className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ChessBoard
              fen={positions[currentPosition].fen}
              size="full"
            />
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
          {mode === 'new' && 'Save Opening'}
          {mode === 'add' && 'Save Line'}
          {mode === 'modify' && 'Update Notes'}
        </button>
      </div>
    )}
  </div>
);

};

export default OpeningUploader;
