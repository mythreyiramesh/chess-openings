import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { getOpenings } from './utils/openingsManager';

const OpeningsList = ({ onReview }) => {
  const [openings, setOpenings] = useState([]);
  const [expandedOpenings, setExpandedOpenings] = useState({});

  useEffect(() => {
    const loadedOpenings = getOpenings();
    setOpenings(loadedOpenings);
  }, []);

  const toggleOpening = (openingId) => {
    setExpandedOpenings(prev => ({
      ...prev,
      [openingId]: !prev[openingId]
    }));
  };

   const handleReviewClick = (openingId, lineId) => {
    onReview(openingId, lineId);
  };

  const renderOpeningGroup = (openings, color) => {
    if (!openings.length) return null;

    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          For {color}
        </h2>
        <div className="space-y-4">
          {openings.map(opening => (
            <div
              key={opening.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Opening Header */}
              <button
                onClick={() => toggleOpening(opening.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-lg text-gray-800">
                  {opening.name}
                </span>
                {expandedOpenings[opening.id] ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Lines */}
              {expandedOpenings[opening.id] && (
                <div className="border-t border-gray-100">
                  {opening.lines.map(line => (
                    <div
                      key={line.id}
                      className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="font-medium text-gray-800">
                            {line.name}
                          </h3>
                          {line.summary && (
                            <p className="mt-1 text-sm text-gray-600">
                              {line.summary}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(opening.id, line.id);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const whiteOpenings = openings.filter(op => op.isWhite);
  const blackOpenings = openings.filter(op => !op.isWhite);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Available Chess Openings
      </h1>

      {whiteOpenings.length === 0 && blackOpenings.length === 0 ? (
        <p className="text-center text-gray-600 py-8">
          No openings available. Import or create some openings to get started.
        </p>
      ) : (
        <>
          {renderOpeningGroup(whiteOpenings, "White")}
          {renderOpeningGroup(blackOpenings, "Black")}
        </>
      )}
    </div>
  );
};

export default OpeningsList;
