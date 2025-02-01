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

  useEffect(() => {
    const loadedOpenings = getOpenings();
    setOpenings(loadedOpenings);
    if (loadedOpenings.length > 0) {
      setSelectedOpening(loadedOpenings[0]);
    }
  }, []);

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
            lines: [line.name],
            isFirstUniqueMove: false
          };
        } else {
          if (!currentNode.children[position.move].lines.includes(line.name)) {
            currentNode.children[position.move].lines.push(line.name);
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

    const handleNodeClick = (node) => {
      if (node.move !== 'start') {
        setSelectedNode(node);
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
        <g
          onClick={() => handleNodeClick(node)}
          className="cursor-pointer"
        >
          <rect
            x={x - nodeWidth/2}
            y={y}
            width={nodeWidth}
            height={nodeHeight}
            rx="4"
            className={`stroke-gray-300 ${node.notes ? 'fill-blue-50' : 'fill-white'} hover:fill-gray-100`}
          />

          <text
            x={x}
            y={y + nodeHeight/2}
            className="text-sm font-medium pointer-events-none"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {`${Math.ceil(node.depth / 2)}${node.depth % 2 === 0 ? '...' : '.'} ${node.move}`}
          </text>

          {node.isFirstUniqueMove && (
            <text
              x={x}
              y={y - 8}
              className="text-xs text-gray-500 pointer-events-none"
              textAnchor="middle"
            >
              {node.lines.join(', ')}
            </text>
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
            {opening.name}
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
                    size="full"
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-2">Notes:</h3>
                  <p className="text-gray-600">
                    {selectedNode?.notes || "No notes for this position."}
                  </p>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default OpeningTree;
