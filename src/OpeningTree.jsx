import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { getOpenings } from './utils/openingsManager';
import ChessBoard from './ChessBoard';

const OpeningTree = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLineSummaryDialogOpen, setIsLineSummaryDialogOpen] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState(null);

  useEffect(() => {
    const loadedOpenings = getOpenings();
    setOpenings(loadedOpenings);
    if (loadedOpenings.length > 0) {
      setSelectedOpening(loadedOpenings[0]);
    }
  }, []);

  const getLineById = (lineId) => {
  return selectedOpening?.lines.find(line => line.id === lineId);
};

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
            children: {},
            depth: index + 1,
            lines: [{ id: line.id, name: line.name }], // Store both id and name
            isFirstUniqueMove: false
          };
        }  else {
        if (!currentNode.children[position.move].lines.some(l => l.id === line.id)) {
          currentNode.children[position.move].lines.push({ id: line.id, name: line.name });
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
        height: depth * 80 + 40,
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
    const height = Math.max(...childDimensions.map(d => d.height));

    return {
      width,
      height,
      leafCount: totalLeaves
    };
  };
const TreeNode = ({ node, x, y, availableWidth }) => {
  const children = Object.values(node.children);
  const nodeWidth = 120;
  const nodeHeight = 40;
  const levelHeight = 80;

  const getPieceImage = (move, depth) => {
    const pieceMap = {
      'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'P': 'p'
    };

    const piece = move.match(/^[KQRBN]/)?.[0] || 'P';
    const color = (depth - 1) % 2 === 1 ? 'w' : 'b';
    const pieceLetter = pieceMap[piece].toLowerCase();

    return `/pieces/${color}${pieceLetter}.svg`;
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


  if (node.move === 'start') {
    return (
      <g>
        {children.map((child, index) => {
          const childDims = calculateDimensions(child);
          return (
            <TreeNode
              key={child.move}
              node={child}
              x={x}
              y={levelHeight}
              availableWidth={childDims.width}
            />
          );
        })}
      </g>
    );
  }

  const childDimensions = children.map(child => calculateDimensions(child));
  const totalChildWidth = childDimensions.reduce((sum, dim) => sum + dim.width, 0);
  let currentX = x - totalChildWidth / 2;

  return (
<g>
      <g onClick={() => handleNodeClick(node)} className="cursor-pointer">
        <rect
          x={x - nodeWidth/2}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          rx="4"
          className={`stroke-gray-300 ${node.notes ? 'fill-blue-50' : 'fill-white'} hover:fill-gray-100`}
        />
        {node.move === 'Starting Position' ? (
          <text
            x={x}  // Centered x position
            y={y + nodeHeight/2}
            className="text-sm font-medium pointer-events-none"
            textAnchor="middle"  // This centers the text
            dominantBaseline="middle"
          >
            {node.move}
          </text>
        ) : (
          <>
            <text
              x={x - nodeWidth/2 + 10}
              y={y + nodeHeight/2}
              className="text-sm font-medium pointer-events-none"
              textAnchor="start"
              dominantBaseline="middle"
            >
              {getMoveNotation(node.move, node.depth)}
            </text>
            <image
              href={getPieceImage(node.move, node.depth)}
              x={x - nodeWidth/2 + 35}
              y={y + (nodeHeight - 20)/2}
              width="20"
              height="20"
              className="pointer-events-none"
            />
            <text
              x={x - nodeWidth/2 + 60}
              y={y + nodeHeight/2}
              className="text-sm font-medium pointer-events-none"
              textAnchor="start"
              dominantBaseline="middle"
            >
              {node.move.replace(/^[KQRBN]/, '')}
            </text>
          </>
        )}

        {node.isFirstUniqueMove && node.lines.length === 1 && (
          <g>
            <rect
              x={x - 50}
              y={y - 20}
              width={100}
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
              x={x}
              y={y - 12}
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
      {children.map((child, index) => {
        const childWidth = childDimensions[index].width;
        const childX = currentX + childWidth / 2;
        currentX += childWidth;

        return (
          <g key={`${child.move}-${index}`}>
            <path
              d={`M ${x} ${y + nodeHeight} L ${childX} ${y + levelHeight}`}
              className="stroke-gray-300"
              fill="none"
            />
            <TreeNode
              node={child}
              x={childX}
              y={y + levelHeight}
              availableWidth={childWidth}
            />
          </g>
        );
      })}
    </g>
  );
};
  if (!selectedOpening) {
    return <div className="p-4">No openings found</div>;
  }

  const moveTree = buildMoveTree(selectedOpening.lines);
  const dimensions = calculateDimensions(moveTree);

  return (
    <div className="p-4">
      <select
        className="mb-4 w-full max-w-xs p-2 border rounded-md shadow-sm"
        value={selectedOpening.id}
        onChange={(e) => setSelectedOpening(openings.find(o => o.id === e.target.value))}
      >
        {openings.map(opening => (
          <option key={opening.id} value={opening.id}>
            {opening.name} ({opening.isWhite ? 'White' : 'Black'})
          </option>
        ))}
      </select>

      <div className="bg-white rounded-lg shadow p-4 overflow-auto">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="mx-auto"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          <TreeNode
            node={moveTree}
            x={dimensions.width / 2}
            y={20}
            availableWidth={dimensions.width}
          />
        </svg>
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
                    {selectedNode?.notes || "No notes for this position."}
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
