import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { getOpenings } from './utils/openingsManager';
import ChessBoard from './ChessBoard';

const ChessStudyTool = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpeningId, setSelectedOpeningId] = useState(null);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const moveRefs = useRef({});

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

  // Autoscroll effect
  useEffect(() => {
    if (currentPosition > 0 && moveRefs.current[currentPosition] && containerRef.current) {
      const container = containerRef.current;
      const element = moveRefs.current[currentPosition];

      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [currentPosition]);

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

  const selectedOpening = openings.find(op => op.id === selectedOpeningId);
  const selectedLine = selectedOpening?.lines.find(line => line.id === selectedLineId);

  const getCurrentNote = () => {
    if (!selectedOpening || !selectedLine || currentPosition >= selectedLine.positions.length) {
      return '';
    }
    const currentFen = selectedLine.positions[currentPosition].fen;
    return selectedOpening.notes?.[currentFen]?.content || '';
  };

  const getPieceImage = (move, index) => {
    const pieceMap = {
      'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'P': 'p'
    };

    const piece = move.match(/^[KQRBN]/)?.[0] || 'P';
    const color = index % 2 === 0 ? 'w' : 'b';
    const pieceLetter = pieceMap[piece].toLowerCase();

    return `/pieces/${color}${pieceLetter}.svg`;
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
        </div>

        {selectedOpening && (
          <div className="flex-1 min-w-[200px]">
            <div className="flex flex-wrap gap-2">
              {selectedOpening.lines.map(line => (
                <button
                  key={line.id}
                  onClick={() => {
                    setSelectedLineId(line.id);
                    setCurrentPosition(0);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
            selectedLineId === line.id
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 hover:border-blue-500 hover:text-blue-500'
          }`}
                >
                  {line.name}
                </button>
              ))}
            </div>
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

          {/* Add summary here */}
          {selectedLine.summary && (
            <p className="text-gray-600 text-lg mb-6">
              {selectedLine.summary}
            </p>
          )}

          {/* If no summary, maintain spacing */}
          {!selectedLine.summary && <div className="mb-6" />}

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
              {selectedLine.positions.slice(1).map((pos, index) => (
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
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="w-full aspect-square bg-gray-100 rounded-lg">
              <ChessBoard
                fen={selectedLine.positions[currentPosition].fen}
                size="full"
              />
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPosition(prev => Math.max(0, prev - 1))}
              disabled={currentPosition === 0}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setCurrentPosition(prev => Math.min(selectedLine.positions.length - 1, prev + 1))}
              disabled={currentPosition === selectedLine.positions.length - 1}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Right column - Review (25% on large screens) */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-700 whitespace-pre-wrap">
              {getCurrentNote()}
            </div>
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
