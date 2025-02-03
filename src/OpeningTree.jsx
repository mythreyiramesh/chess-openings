import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { getOpenings } from './utils/openingsManager';
import ChessBoard from './ChessBoard';

const OpeningTree = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLineSummaryDialogOpen, setIsLineSummaryDialogOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
const containerRef = useRef(null);

  useEffect(() => {
    const loadedOpenings = getOpenings();
    setOpenings(loadedOpenings);
  }, []);

  const getLineById = (lineId) => {
  return selectedOpening?.lines.find(line => line.id === lineId);
};

  useEffect(() => {
  if (selectedOpening) {
    const newDimensions = {
      width: Math.max(2000, Math.max(...selectedOpening.lines.map(line => line.positions.length)) * 250),
      height: Math.max(800, selectedOpening.lines.length * 100)
    };
    setDimensions(newDimensions);

    // Reset position and scale when opening changes
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }
}, [selectedOpening]);


  useEffect(() => {
  if (selectedOpening && containerRef.current) {
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate initial position to center both horizontally and vertically
    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    setPosition({
      x: Math.max(0, (containerWidth - scaledWidth) / 2),
      y: Math.max(0, (containerHeight - scaledHeight) / 2)
    });
  }
}, [selectedOpening, dimensions, scale]);


  const buildMoveTree = (lines) => {
    const root = { children: {}, move: 'start', depth: 0 };

    lines.forEach(line => {
      let currentNode = root;
      line.positions.forEach((position, index) => {
        if (!currentNode.children[position.move]) {
          currentNode.children[position.move] = {
            move: position.move,
            fen: position.fen,
            notes: selectedOpening.notes?.[position.fen]?.content || '',
            noteworthy: position.noteworthy || false,
            children: {},
            depth: index + 1,
            lines: [{ id: line.id, name: line.name }], // Store both id and name
            isFirstUniqueMove: false
          };
        }  else {
        if (!currentNode.children[position.move].lines.some(l => l.id === line.id)) {
          currentNode.children[position.move].lines.push({ id: line.id, name: line.name });
          // Update noteworthy if this position is noteworthy in any line
          if (position.noteworthy) {
            currentNode.children[position.move].noteworthy = true;
          }
        }
      }
      currentNode = currentNode.children[position.move];
    });
  });

    const hasMultipleBranches = (node) => {
      const children = Object.values(node.children);
      if (children.length > 1) return true;
      return children.some(child => hasMultipleBranches(child));
    };

    const markFirstUniqueMoves = (node) => {
      const children = Object.values(node.children);
      if (children.length > 1) {
        children.forEach(child => {
          if (child.lines.length < selectedOpening.lines.length) {
            if (!hasMultipleBranches(child)) {
              child.isFirstUniqueMove = true;
            }
          }
        });
      }
      children.forEach(markFirstUniqueMoves);
    };

    markFirstUniqueMoves(root);
    return root;
  };

  const calculateDimensions = (node, depth = 0) => {
  if (!node || Object.keys(node.children).length === 0) {
    return {
      width: 120,
      height: 60, // Reduced from 80
      leafCount: 1
    };
  }

  const children = Object.values(node.children);
  const childDimensions = children.map(child =>
    calculateDimensions(child, depth + 1)
  );

  const totalLeaves = childDimensions.reduce((sum, dim) => sum + dim.leafCount, 0);
  const width = Math.max(
    totalLeaves * 120 * 1.5,
    children.length * 180
  );
  const height = Math.max(...childDimensions.map(d => d.height)) + 60; // Added fixed spacing

  return {
    width,
    height,
    leafCount: totalLeaves
  };
};
const TreeNode = ({ node, x, y, availableHeight }) => {
  const children = Object.values(node.children);
  const nodeWidth = 120;
  const nodeHeight = 40;
  const levelWidth = 180; // Increased for better horizontal spacing
  const minVerticalSpacing = 80; // Minimum space between nodes

  const getPieceImage = (move, depth) => {
    const pieceMap = {
      'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'P': 'p'
    };

    const piece = move.match(/^[KQRBN]/)?.[0] || 'P';
    const color = (depth - 1) % 2 === 1 ? 'w' : 'b';
    const pieceLetter = pieceMap[piece].toLowerCase();

    return `${import.meta.env.BASE_URL}/pieces/${color}${pieceLetter}.svg`;
  };

  const getMoveNumber = (depth) => {
    return Math.ceil((depth - 1) / 2);
  };

  const getMoveNotation = (move, depth) => {
    const moveNumber = getMoveNumber(depth);
    const isWhiteMove = (depth - 1) % 2 === 1;

    if (isWhiteMove) {
      return `${moveNumber}.`;
    }
    return '';
  };

  const handleNodeClick = (node) => {
    if (node.move !== 'start') {
      // Get the first line this position belongs to
      const lineId = node.lines[0]?.id;
      const line = selectedOpening.lines.find(l => l.id === lineId);

      // Find the position index in the line that matches this FEN
      const positionIndex = line.positions.findIndex(pos => pos.fen === node.fen);

      setSelectedNode({
        ...node,
        positions: line.positions,
        positionIndex // use index instead of ID
      });
      setIsDialogOpen(true);
    }
  };


  // Calculate the total number of end nodes for this branch
  const calculateTotalEndNodes = (node) => {
    const children = Object.values(node.children);
    if (children.length === 0) return 1;
    return children.reduce((sum, child) => sum + calculateTotalEndNodes(child), 0);
  };

  if (node.move === 'start') {
    return (
      <g>
        {children.map((child, index) => {
          const totalEndNodes = calculateTotalEndNodes(child);
          const totalSpacing = children.reduce((sum, n) => sum + calculateTotalEndNodes(n), 0) * minVerticalSpacing;
          let accumulatedY = 0;
          for (let i = 0; i < index; i++) {
            accumulatedY += calculateTotalEndNodes(children[i]) * minVerticalSpacing;
          }
          const childY = y - (totalSpacing / 2) + accumulatedY + (totalEndNodes * minVerticalSpacing / 2);

          return (
            <TreeNode
              key={child.move}
              node={child}
              x={x + levelWidth}
              y={childY}
              availableHeight={totalEndNodes * minVerticalSpacing}
            />
          );
        })}
      </g>
    );
  }

  return (
    <g>

      {/* Node rectangle and content */}

      <g onClick={() => handleNodeClick(node)} className="cursor-pointer">
        <rect
          x={x}
          y={y - nodeHeight/2}
          width={nodeWidth}
          height={nodeHeight}
          rx="4"
          className={`stroke-gray-300 ${
            node.noteworthy ? 'fill-purple-50'
            : node.notes ? 'fill-blue-50'
            : 'fill-white'
          } hover:fill-gray-100`}
        />

        {/* Add the purple dot for noteworthy positions */}
        {node.noteworthy && (
          <circle
            cx={x + nodeWidth - 10}
            cy={y - nodeHeight/2 + 6}
            r={4}
            className="fill-purple-500"
            style={{ pointerEvents: 'none' }}
          />
        )}
        {node.move === 'Starting Position' ? (
          <text
            x={x + nodeWidth/2}  // Centered x position
            y={y}
            className="text-sm font-medium pointer-events-none"
            textAnchor="middle"  // This centers the text
            dominantBaseline="middle"
          >
            {node.move}
          </text>
        ) : (
          <>
              <text
                x={x + 10}
                y={y}
                className="text-sm font-medium pointer-events-none"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {node.depth % 2 === 1 ? `${Math.ceil(node.depth/2)}.` : ''}
              </text>
              <image
                href={`pieces/${(node.depth % 2 === 1 ? 'w' : 'b')}${node.move.match(/^[KQRBN]/) ? node.move[0].toLowerCase() : 'p'}.svg`}
                x={x + 35}
                y={y - 10}
                width="20"
                height="20"
                className="pointer-events-none"
              />
              <text
                x={x + 60}
                y={y}
                className="text-sm font-medium pointer-events-none"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {node.move.replace(/^[KQRBN]/, '')}
              </text>
          </>
        )}

        {/* Move the line name above the node */}

        {node.isFirstUniqueMove && node.lines.length === 1 && (
          <g>
            <rect
              x={x + (nodeWidth - 50)/2}
              y={y - nodeHeight}
              width={50}
              height={16}
              rx="8"
              className="fill-gray-100 stroke-gray-300 cursor-pointer hover:fill-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLineId(node.lines[0].id);
                setIsLineSummaryDialogOpen(true);
              }}
            />
            <text
              x={x + nodeWidth/2}
              y={y - nodeHeight + 9}
              className="text-xs font-medium text-blue-600 cursor-pointer"
              textAnchor="middle"
              dominantBaseline="middle"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedLineId(node.lines[0].id);
                setIsLineSummaryDialogOpen(true);
              }}
            >
              {node.lines[0].name}
            </text>
          </g>
        )}
      </g>
      {/* Draw connections and child nodes */}

      {children.map((child, index) => {
        const totalEndNodes = calculateTotalEndNodes(child);
        const totalSpacing = children.reduce((sum, n) => sum + calculateTotalEndNodes(n), 0) * minVerticalSpacing;
        let accumulatedY = 0;
        for (let i = 0; i < index; i++) {
          accumulatedY += calculateTotalEndNodes(children[i]) * minVerticalSpacing;
        }
        const childY = y - (totalSpacing / 2) + accumulatedY + (totalEndNodes * minVerticalSpacing / 2);

        return (
          <g key={`${child.move}-${index}`}>
            <path
              d={`M ${x + nodeWidth} ${y} L ${x + levelWidth} ${childY}`}
              className="stroke-gray-300"
              fill="none"
            />
            <TreeNode
              node={child}
              x={x + levelWidth}
              y={childY}
              availableHeight={totalEndNodes * minVerticalSpacing}
            />
          </g>
        );
      })}
    </g>
  );
};

  const handleZoomIn = () => setScale(scale => Math.min(scale * 1.2, 2));
  const handleZoomOut = () => setScale(scale => Math.max(scale / 1.2, 0.5));

  if (!selectedOpening) {
    return (
    <div className="p-4">
      <select
        className="mb-4 w-full max-w-xs p-2 border rounded-md shadow-sm"
        value={selectedOpening?.id || ''}
        onChange={(e) => {
          const opening = openings.find(o => o.id === e.target.value);
          setSelectedOpening(opening || null);
        }}
      >
        <option value="">Select an opening</option>
        {openings.map(opening => (
          <option key={opening.id} value={opening.id}>
            {opening.name} ({opening.isWhite ? 'White' : 'Black'})
          </option>
        ))}
      </select>
      <div className="text-gray-600">
        {openings.length === 0
          ? "No openings found"
          : "Please select an opening to view its move tree"}
      </div>
    </div>
  );
  }

  const moveTree = buildMoveTree(selectedOpening.lines);

  return (
    <div className="p-4">

    {/* Controls */}
    <div className="mb-4 flex items-center justify-between">
      <select
        className="w-full max-w-xs p-2 border rounded-md shadow-sm"
        value={selectedOpening?.id || ''}
        onChange={(e) => {
          const opening = openings.find(o => o.id === e.target.value);
          setSelectedOpening(opening || null);
        }}
      >
        <option value="">Select an opening</option>
        {openings.map(opening => (
          <option key={opening.id} value={opening.id}>
            {opening.name} ({opening.isWhite ? 'White' : 'Black'})
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>
    </div>

      {/* Tree Container */}
    <div className="bg-white rounded-lg shadow">
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div
          style={{
            padding: '40px',
            minWidth: dimensions.width + 200, // Extra space for padding
            minHeight: dimensions.height + 80  // Extra space for padding
          }}
        >
          <motion.div
            drag
            dragMomentum={false}
            style={{
              scale,
              x: position.x,
              y: position.y,
            }}
            onDragEnd={(e, info) => {
              setPosition({
                x: position.x + info.offset.x,
                y: position.y + info.offset.y
              });
            }}
          >
            <svg
              width={dimensions.width}
              height={dimensions.height}
            >
              <TreeNode
                node={moveTree}
                x={200} // Increased starting position
                y={dimensions.height / 2}
                availableHeight={dimensions.height}
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </div>



      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-xl shadow-lg">
            <div className="relative p-6">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>

              <Dialog.Title className="text-lg font-medium mb-4">
                Position after {selectedNode?.move}
              </Dialog.Title>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="w-full aspect-square">
                  <ChessBoard
                    fen={selectedNode?.fen}
                    move={selectedNode?.move}
                    positions={selectedNode?.positions}
                    positionId={selectedNode?.positionIndex} // pass index as ID
                    size="full"
                  />
                </div>

                <div>
                  <p className="text-gray-600">
                    {selectedNode?.noteworthy && (
                      <span className="block text-purple-600 font-medium mb-2">
                        Position noteworthy
                      </span>
                    )}
                    {selectedNode?.notes || "No additional notes."}
                  </p>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Line Summary Dialog */}
<Dialog
  open={isLineSummaryDialogOpen}
  onClose={() => setIsLineSummaryDialogOpen(false)}
  className="relative z-50"
>
  <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

  <div className="fixed inset-0 flex items-center justify-center p-4">
    <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-lg">
      <div className="relative p-6">
        <button
          onClick={() => setIsLineSummaryDialogOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>

        <Dialog.Title className="text-lg font-medium mb-4">
          {getLineById(selectedLineId)?.name}
        </Dialog.Title>

        <div className="prose prose-sm">
          <p className="text-gray-600">
            {getLineById(selectedLineId)?.summary || "No summary available for this line."}
          </p>
        </div>
      </div>
    </Dialog.Panel>
  </div>
</Dialog>
    </div>
  );
};

export default OpeningTree;
