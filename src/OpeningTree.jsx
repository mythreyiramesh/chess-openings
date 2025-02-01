import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getOpenings } from './utils/openingsManager';

const OpeningTree = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Convert linear lines into a tree structure
  const buildMoveTree = (lines) => {
    const root = { children: {}, move: 'start' };

    lines.forEach(line => {
      let currentNode = root;
      line.positions.forEach(position => {
        if (!currentNode.children[position.move]) {
          currentNode.children[position.move] = {
            move: position.move,
            fen: position.fen,
            notes: position.notes,
            children: {},
            lineName: line.name
          };
        }
        currentNode = currentNode.children[position.move];
      });
    });

    return root;
  };

  useEffect(() => {
    const loadedOpenings = getOpenings();
    setOpenings(loadedOpenings);
    if (loadedOpenings.length > 0) {
      setSelectedOpening(loadedOpenings[0]);
    }
  }, []);

  const toggleNode = (move) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(move)) {
        newSet.delete(move);
      } else {
        newSet.add(move);
      }
      return newSet;
    });
  };

  const renderMoveTree = (node, depth = 0, path = '') => {
    if (!node) return null;

    const currentPath = `${path}${node.move}`;
    const hasChildren = Object.keys(node.children).length > 0;
    const isExpanded = expandedNodes.has(currentPath);

    return (
      <div key={currentPath} className={`${depth > 0 ? 'ml-6' : ''}`}>
        {node.move !== 'start' && (
          <div className="flex items-center group">
            <div className="w-6 flex-shrink-0">
              {hasChildren && (
                <button
                  onClick={() => toggleNode(currentPath)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            <div className="flex-1 py-2">
              <div className="flex items-center">
                <span className="font-mono font-medium">
                  {Math.floor((depth + 1) / 2)}.
                  {depth % 2 === 0 ? '' : '..'} {node.move}
                </span>
                {node.lineName && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({node.lineName})
                  </span>
                )}
              </div>
              {node.notes && (
                <div className="text-sm text-gray-600 ml-8">
                  {node.notes}
                </div>
              )}
            </div>
          </div>
        )}

        {hasChildren && (isExpanded || node.move === 'start') && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l-2 border-gray-200"
            >
              {Object.values(node.children).map(childNode =>
                renderMoveTree(childNode, depth + 1, currentPath)
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
  };

  if (!selectedOpening) {
    return <div className="p-4">No openings found</div>;
  }

  const moveTree = buildMoveTree(selectedOpening.lines);

  return (
    <div className="p-4">
      <select
        className="mb-4 w-full max-w-xs p-2 border rounded-md shadow-sm"
        value={selectedOpening.id}
        onChange={(e) => {
          setSelectedOpening(openings.find(o => o.id === e.target.value));
          setExpandedNodes(new Set());
        }}
      >
        {openings.map(opening => (
          <option key={opening.id} value={opening.id}>
            {opening.name}
          </option>
        ))}
      </select>

      <div className="bg-white rounded-lg shadow p-4">
        {renderMoveTree(moveTree)}
      </div>
    </div>
  );
};

export default OpeningTree;
