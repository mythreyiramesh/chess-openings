// src/utils/openingsManager.js
import { v4 as uuidv4 } from 'uuid';

export const getOpenings = () => {
  return JSON.parse(localStorage.getItem('chessopenings') || '[]');
};

export const deleteOpening = (id) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const filtered = openings.filter(op => op.id !== id);
  localStorage.setItem('chessopenings', JSON.stringify(filtered));
  return filtered;
};

export const updateOpening = (id, updatedOpening) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const index = openings.findIndex(op => op.id === id);
  if (index !== -1) {
    openings[index] = updatedOpening;
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[index];
  }
  return null;
};

export const getOpeningById = (id) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  return openings.find(op => op.id === id);
};

export const getLineById = (openingId, lineId) => {
  const opening = getOpeningById(openingId);
  return opening?.lines.find(line => line.id === lineId);
};

export const exportOpenings = () => {
  const openings = getOpenings();
  const blob = new Blob([JSON.stringify(openings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chess-openings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importOpenings = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const openings = JSON.parse(e.target.result);
        if (!Array.isArray(openings)) {
          throw new Error('Invalid format: expected an array');
        }

        // Validate each opening
        openings.forEach(opening => {
          if (!opening.id || !opening.name || !Array.isArray(opening.lines)) {
            throw new Error('Invalid opening format: missing required fields');
          }

          // Validate each line
          opening.lines.forEach(line => {
            if (!line.id || !line.name || !Array.isArray(line.positions)) {
              throw new Error('Invalid line format: missing required fields');
            }

            // Validate positions
            line.positions.forEach(position => {
              if (!position.fen || !position.move) {
                throw new Error('Invalid position format: missing required fields');
              }
            });
          });
        });

        localStorage.setItem('chessopenings', JSON.stringify(openings));
        resolve(openings);
      } catch (error) {
        reject(new Error(`Invalid file format: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

// Line-specific operations
export const addLineToOpening = (openingId, line) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1) {
    const newLine = {
      id: uuidv4(),
      name: line.name,
      positions: line.positions
    };
    openings[openingIndex].lines.push(newLine);
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const updateLine = (openingId, lineId, updatedLine) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1) {
    const lineIndex = openings[openingIndex].lines.findIndex(l => l.id === lineId);
    if (lineIndex !== -1) {
      openings[openingIndex].lines[lineIndex] = {
        ...openings[openingIndex].lines[lineIndex],
        ...updatedLine
      };
      localStorage.setItem('chessopenings', JSON.stringify(openings));
      return openings[openingIndex];
    }
  }
  return null;
};

export const deleteLine = (openingId, lineId) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1 && openings[openingIndex].lines.length > 1) {
    openings[openingIndex].lines = openings[openingIndex].lines.filter(l => l.id !== lineId);
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const createNewOpening = (name, firstLine) => {
  const newOpening = {
    id: uuidv4(),
    name: name,
    lines: [
      {
        id: uuidv4(),
        name: firstLine.name || "Main Line",
        positions: firstLine.positions || []
      }
    ]
  };

  const openings = getOpenings();
  openings.push(newOpening);
  localStorage.setItem('chessopenings', JSON.stringify(openings));
  return newOpening;
};

// Example opening structure:
/*
{
  id: "uuid",
  name: "Opening Name",
  lines: [
    {
      id: "line-uuid",
      name: "Line Name",
      positions: [
        {
          fen: "starting position",
          move: "e4",
          notes: "optional notes"
        },
        // ... more positions
      ]
    },
    // ... more lines
  ]
}
*/
