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

export const addNoteToOpening = (openingId, fen, noteContent) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1) {
    if (!openings[openingIndex].notes) {
      openings[openingIndex].notes = {};
    }

    openings[openingIndex].notes[fen] = {
      id: uuidv4(),
      content: noteContent,
      referencedBy: []
    };

    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const updateNote = (openingId, fen, noteContent) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1 && openings[openingIndex].notes?.[fen]) {
    openings[openingIndex].notes[fen].content = noteContent;
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const updateOpeningNotes = (openingId, notes) => {
  const openings = getOpenings();
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1) {
    openings[openingIndex].notes = notes;
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const addLineToOpening = (openingId, { line, notes }) => {
  const openings = JSON.parse(localStorage.getItem('chessopenings') || '[]');
  const openingIndex = openings.findIndex(op => op.id === openingId);

  if (openingIndex !== -1) {
    const lineId = uuidv4();
    const newLine = {
      id: lineId,
      name: line.name,
      positions: line.positions
    };

    // Add new notes
    Object.entries(notes).forEach(([fen, noteData]) => {
      if (openings[openingIndex].notes[fen]) {
        // If note exists for this position, add the line reference
        if (!openings[openingIndex].notes[fen].referencedBy.includes(lineId)) {
          openings[openingIndex].notes[fen].referencedBy.push(lineId);
        }
      } else {
        // If note doesn't exist, create it
        openings[openingIndex].notes[fen] = {
          ...noteData,
          referencedBy: [lineId]
        };
      }
    });

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
      // Remove line reference from old positions' notes
      const oldPositions = openings[openingIndex].lines[lineIndex].positions;
      if (openings[openingIndex].notes) {
        oldPositions.forEach(pos => {
          if (openings[openingIndex].notes[pos.fen]) {
            openings[openingIndex].notes[pos.fen].referencedBy =
              openings[openingIndex].notes[pos.fen].referencedBy.filter(id => id !== lineId);
          }
        });
      }

      // Update line
      openings[openingIndex].lines[lineIndex] = {
        ...openings[openingIndex].lines[lineIndex],
        ...updatedLine
      };

      // Add line reference to new positions' notes
      if (openings[openingIndex].notes) {
        updatedLine.positions.forEach(pos => {
          if (openings[openingIndex].notes[pos.fen]) {
            if (!openings[openingIndex].notes[pos.fen].referencedBy.includes(lineId)) {
              openings[openingIndex].notes[pos.fen].referencedBy.push(lineId);
            }
          }
        });
      }

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
    // Remove line reference from notes
    const lineToDelete = openings[openingIndex].lines.find(l => l.id === lineId);
    if (openings[openingIndex].notes && lineToDelete) {
      lineToDelete.positions.forEach(pos => {
        if (openings[openingIndex].notes[pos.fen]) {
          openings[openingIndex].notes[pos.fen].referencedBy =
            openings[openingIndex].notes[pos.fen].referencedBy.filter(id => id !== lineId);

          // Clean up notes that are no longer referenced
          if (openings[openingIndex].notes[pos.fen].referencedBy.length === 0) {
            delete openings[openingIndex].notes[pos.fen];
          }
        }
      });
    }

    openings[openingIndex].lines = openings[openingIndex].lines.filter(l => l.id !== lineId);
    localStorage.setItem('chessopenings', JSON.stringify(openings));
    return openings[openingIndex];
  }
  return null;
};

export const createNewOpening = (name, { line, notes }) => {
  const lineId = uuidv4();
  const newOpening = {
    id: uuidv4(),
    name: name,
    notes: {},
    lines: [{
      id: lineId,
      name: line.name,
      positions: line.positions
    }]
  };

  // Add the notes and set the referencedBy to the new line ID
  Object.entries(notes).forEach(([fen, noteData]) => {
    newOpening.notes[fen] = {
      ...noteData,
      referencedBy: [lineId]
    };
  });

  const openings = getOpenings();
  openings.push(newOpening);
  localStorage.setItem('chessopenings', JSON.stringify(openings));
  return newOpening;
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

          // Ensure notes object exists
          if (!opening.notes) {
            opening.notes = {};
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

export const exportOpenings = () => {
  const openings = getOpenings();
  // Ensure each opening has a notes object if it doesn't already
  const processedOpenings = openings.map(opening => ({
    ...opening,
    notes: opening.notes || {}
  }));

  const blob = new Blob([JSON.stringify(processedOpenings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chess-openings-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Example opening structure:
/*
 {
  id: "uuid",
  name: "Opening Name",
  notes: {
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1": {
      id: "note-uuid",
      content: "Common note for e4 position",
      // Optionally track which lines reference this note
      referencedBy: ["line-uuid-1", "line-uuid-2"]
    }
    // ... more position notes indexed by FEN
  },
  lines: [
    {
      id: "line-uuid-1",
      name: "Main Line",
      positions: [
        {
          fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
          move: "e4",
        }
      ]
    }
  ]
}
 */
