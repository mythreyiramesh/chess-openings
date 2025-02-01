import React, { useState, useEffect } from 'react';
import { getOpenings } from './utils/openingsManager';

const OpeningTree = () => {
  const [openings, setOpenings] = useState([]);
  const [selectedOpening, setSelectedOpening] = useState(null);

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
            // Get notes from the opening's notes object using the FEN as key
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

  // Calculate dimensions for layout planning
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

  // Render node component
  const TreeNode = ({ node, x, y, availableWidth }) => {
    const children = Object.values(node.children);
    const nodeWidth = 120;
    const nodeHeight = 40;
    const levelHeight = 80;

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
        {/* Node rectangle */}
        <rect
          x={x - nodeWidth/2}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          rx="4"
          className={`stroke-gray-300 ${node.notes ? 'fill-blue-50' : 'fill-white'}`}
        />

        {/* Move text */}
        <text
          x={x}
          y={y + nodeHeight/2}
          className="text-sm font-medium"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {`${Math.ceil(node.depth / 2)}${node.depth % 2 === 0 ? '...' : '.'} ${node.move}`}
        </text>

        {/* Line names for unique moves */}
        {node.isFirstUniqueMove && (
          <text
            x={x}
            y={y - 8}
            className="text-xs text-gray-500"
            textAnchor="middle"
          >
            {node.lines.join(', ')}
          </text>
        )}

        {/* Notes indicator */}
        {node.notes && (
          <circle
            cx={x + nodeWidth/2 - 8}
            cy={y + 8}
            r={4}
            className="fill-blue-500"
          />
        )}

        {/* Connect children */}
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
    </div>
  );
};

export default OpeningTree;
