import React, { useState, useEffect, useRef } from 'react';
import { Save, ChevronLeft, ChevronRight, Upload, Trash2, Download } from 'lucide-react';
import { createNewOpening, addLineToOpening, getOpenings, updateOpeningNotes,
         exportOpenings, importOpenings, deleteOpening, deleteLine, updateLine } from './utils/openingsManager';
import ChessBoard from './ChessBoard';
import { Chess } from 'chess.js';

const OpeningUploader = () => {
  const [mode, setMode] = useState('new'); // 'new', 'add', or 'modify'
  const [openingName, setOpeningName] = useState('');
  const [isWhite, setIsWhite] = useState(true); // default to true for white
  const [lineName, setLineName] = useState('');
  const [selectedOpeningId, setSelectedOpeningId] = useState('');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [positions, setPositions] = useState([]);
  const [notes, setNotes] = useState({});
  const [existingNotes, setExistingNotes] = useState({});
  const [modifiedNotes, setModifiedNotes] = useState({});
  const [summary, setSummary] = useState('');
  const [modifiedSummary, setModifiedSummary] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [pgn, setPgn] = useState('');
  const [isPgnParsed, setIsPgnParsed] = useState(false);
  const [openings, setOpenings] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const containerRef = useRef(null);
  const moveRefs = useRef({});


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
        setSummary(line.summary || ''); // Ensure we handle undefined summary
        setModifiedSummary(false);
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

   // Effect to handle auto-scrolling when currentPosition changes
  useEffect(() => {
    const moveButton = moveRefs.current[currentPosition];
    if (moveButton && containerRef.current) {
      const container = containerRef.current;
      const buttonRect = moveButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (buttonRect.bottom > containerRect.bottom || buttonRect.top < containerRect.top) {
        moveButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentPosition]);


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

  const handleDeleteLine = (openingId, lineId) => {
  if (window.confirm('Are you sure you want to delete this line?')) {
    const updatedOpening = deleteLine(openingId, lineId);
    if (updatedOpening) {
      const newOpenings = openings.map(op =>
        op.id === openingId ? updatedOpening : op
      );
      setOpenings(newOpenings);
      if (selectedLineId === lineId) {
        setSelectedLineId(updatedOpening.lines[0]?.id || null);
        setCurrentPosition(0);
      }
    }
  }
};

  const handleResetAll = () => {
  if (window.confirm('Are you sure you want to remove all openings? This action cannot be undone.')) {
    localStorage.removeItem('openings');
    setOpenings([]);
    resetAll();
  }
};

  const getPieceImage = (move, index) => {
    const pieceMap = {
      'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'P': 'p'
    };

    const piece = move.match(/^[KQRBN]/)?.[0] || 'P';
    const color = index % 2 === 0 ? 'w' : 'b';
    const pieceLetter = pieceMap[piece].toLowerCase();

    return `${import.meta.env.BASE_URL}pieces/${color}${pieceLetter}.svg`;
  };

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
      moveNumber: 0,
      noteworthy: false
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
            moveNumber: Math.floor(positions.length / 2),
            noteworthy: false
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
        // If summary was modified, update the line
      if (modifiedSummary) {
        const opening = openings.find(op => op.id === selectedOpeningId);
        const existingLine = opening?.lines.find(l => l.id === selectedLineId);

        updateLine(selectedOpeningId, selectedLineId, {
          name: existingLine.name, // Preserve existing name
          summary: summary,
          positions: positions.map(pos => ({
            fen: pos.fen,
            move: pos.move,
            from: pos.from,
            to: pos.to,
            noteworthy: pos.noteworthy || false,
          }))
        });
      }
      alert('Notes and summary updated successfully!');
      } else {
        const lineData = {
          name: lineName || '',
          summary: summary,
          positions: positions.map(pos => ({
            fen: pos.fen,
            move: pos.move,
            from: pos.from,
            to: pos.to,
            noteworthy: pos.noteworthy || false
          }))
        };

        if (mode === 'new') {
          if (!openingName) {
            alert('Please enter an opening name');
            return;
          }
          createNewOpening(openingName, isWhite, {
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
    setIsWhite(true); // Reset to default value
    setLineName('');
    setSelectedOpeningId('');
    setSelectedLineId('');
    setSummary(''); // Add this line
    setModifiedSummary(false); // Add this line
  };

return (
  <div className="max-w-4xl mx-auto p-4">

    <div className="flex items-center justify-center space-x-4 mb-6">
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
      {openings.length > 0 && (
      <button
        onClick={handleResetAll}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Reset All
      </button>
    )}
    </div>
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
        Modify/Delete
      </button>
    </div>

    {/* Opening/Line Selection */}
<div className="space-y-4 mb-6">
  {mode === 'new' ? (
    <div className="space-y-4">
    <input
      type="text"
      value={openingName}
      onChange={(e) => setOpeningName(e.target.value)}
      placeholder="Opening Name"
      className="w-full p-3 border rounded-lg"
    />
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="isWhite"
        checked={isWhite}
        onChange={(e) => setIsWhite(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label htmlFor="isWhite" className="text-sm font-medium text-gray-700">
        Opening for White
      </label>
    </div>
  </div>
  ) : (
    <>
      <div className="flex gap-2">
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
          <button
            onClick={() => handleDelete(selectedOpeningId)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {mode === 'modify' && selectedOpeningId && (
        <div className="flex gap-2">
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
          {selectedLineId && (
            <button
              onClick={() => handleDeleteLine(selectedOpeningId, selectedLineId)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
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
{/* Line Summary Section */}
{(isPgnParsed || (mode === 'modify' && selectedOpeningId && selectedLineId)) && (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <label className="block font-medium text-gray-700">
        Line Summary
      </label>
      {summary && !modifiedSummary && (
        <span className="text-sm text-gray-500">
          Existing summary
        </span>
      )}
      {summary && modifiedSummary && (
        <span className="text-sm text-gray-500">
          Modified from existing summary
        </span>
      )}
    </div>
    <textarea
      value={summary}
      onChange={(e) => {
        setSummary(e.target.value);
        if (mode === 'modify' && selectedOpeningId && selectedLineId) {
          const opening = openings.find(op => op.id === selectedOpeningId);
          const line = opening?.lines.find(l => l.id === selectedLineId);
          if (line) {
            setModifiedSummary(e.target.value !== line.summary);
          }
        } else {
          setModifiedSummary(true);
        }
      }}
      className={`w-full h-24 p-3 border rounded-lg ${
        modifiedSummary
          ? 'border-yellow-500'
          : summary
          ? 'border-gray-300 bg-gray-50'
          : 'border-gray-300'
      }`}
      placeholder="Add a summary for this line..."
    />
  </div>
)}

    {/* Position Review Section */}
    {((mode !== 'modify' && isPgnParsed) ||
  (mode === 'modify' && selectedOpeningId && selectedLineId)) &&
  positions.length > 0 && (

    <div className="mt-6">
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column - Moves list (25% on large screens) */}
      <div className="w-full lg:w-1/4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Moves:</h3>

        {/* Starting position */}
        <div className="mb-2">
          <button
            onClick={() => setCurrentPosition(0)}
            className={`
              px-2 py-1 rounded
              text-sm font-medium
              transition-all duration-150 ease-in-out
              ${currentPosition === 0
                ? 'bg-blue-100 text-blue-800 shadow-sm'
                : 'hover:bg-gray-200 hover:shadow-sm'
              }
              ${modifiedNotes[positions[0].fen]
                ? 'ring-1 ring-yellow-400'
                : notes[positions[0].fen]
                ? 'ring-1 ring-pink-400'
                : 'hover:ring-1 hover:ring-gray-300'
              }
            `}
          >
            Starting Position
          </button>
        </div>


        {/* Move list with consistent spacing */}
        <div
      ref={containerRef}
      className="h-48 lg:h-auto lg:max-h-[20rem] overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-x-1 gap-y-2">
        {positions.slice(1).map((pos, index) => (
          <div key={index} className="flex items-center gap-1">
            {index % 2 === 0 && (
              <span className="text-sm text-gray-500 font-medium">
                {`${Math.floor(index / 2) + 1}.`}
              </span>
            )}
            <button
              ref={el => moveRefs.current[index + 1] = el}
              onClick={() => setCurrentPosition(index + 1)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded
                text-sm font-medium
                transition-all duration-150 ease-in-out
                ${currentPosition === index + 1
                  ? 'bg-blue-100 text-blue-800 shadow-sm'
                  : 'hover:bg-gray-200 hover:shadow-sm'
                }
                ${modifiedNotes[pos.fen]
                  ? 'ring-1 ring-yellow-400'
                  : notes[pos.fen]
                  ? 'ring-1 ring-pink-400'
                  : 'hover:ring-1 hover:ring-gray-300'
                }
              `}
            >
              <img
                src={getPieceImage(pos.move, index)}
                alt=""
                className="w-4 h-4"
              />
              <span>{pos.move.replace(/[KQRBN]/, '')}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
      </div>

      {/* Middle column - Chessboard and navigation (50% on large screens) */}
      <div className="w-full lg:w-1/2">
        <ChessBoard
          fen={positions[currentPosition].fen}
          move={positions[currentPosition].move}
          positions={positions}
          positionId={currentPosition}
        />

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPosition(prev => Math.max(0, prev - 1))}
            disabled={currentPosition === 0}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentPosition(prev => Math.min(positions.length - 1, prev + 1))}
            disabled={currentPosition === positions.length - 1}
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Right column - Notes (25% on large screens) */}
      <div className="w-full lg:w-1/4">
        <div className="flex justify-between items-center mb-2">
          <label className="block font-medium text-gray-700">
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

        {/* Add noteworthy checkbox */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id="noteworthy"
            checked={positions[currentPosition].noteworthy || false}
            onChange={(e) => {
              // Update the positions array
              const newPositions = [...positions];
              newPositions[currentPosition] = {
                ...newPositions[currentPosition],
                noteworthy: e.target.checked
              };
              setPositions(newPositions);

              // Mark this position as modified
              setModifiedNotes(prev => ({
                ...prev,
                [positions[currentPosition].fen]: true
              }));
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="noteworthy" className="text-sm text-gray-700">
            Mark as noteworthy position
          </label>
        </div>

        <textarea
          value={notes[positions[currentPosition].fen] || ''}
          onChange={(e) => handleUpdateNotes(e.target.value)}
          className={`w-full h-48 lg:h-[12rem] p-3 border rounded-lg ${
            modifiedNotes[positions[currentPosition].fen]
              ? 'border-yellow-500'
              : existingNotes[positions[currentPosition].fen]
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300'
          }`}
          placeholder="Add notes for this position..."
        />
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
