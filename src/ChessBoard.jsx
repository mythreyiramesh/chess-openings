import React from 'react';
import { Chess } from 'chess.js';

const ChessBoard = ({
  fen,  // current position FEN
  move, // current move
  positions, // array of all positions in this line
  positionId, // current position ID
  size = "full"
}) => {
  const findPreviousPosition = () => {
    if (!positions || positionId === undefined) return null;

    if (positionId > 0) {
      return positions[positionId - 1].fen;
    }
    // If it's the first move, use the initial position
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  };

  const parseMove = (moveStr, prevPosition) => {
    if (!moveStr || !prevPosition) return null;

    try {
      const chess = new Chess(prevPosition);
      const moveDetails = chess.moves({ verbose: true }).find(m =>
        m.san === moveStr || m.lan === moveStr
      );

      if (moveDetails) {
        return {
          from: moveDetails.from,
          to: moveDetails.to
        };
      }
    } catch (e) {
      console.error('Error parsing move:', e);
    }

    return null;
  };

  const fenToBoard = (fen) => {
    const board = [];
    const fenBoard = fen.split(' ')[0];
    const rows = fenBoard.split('/');

    for (let row of rows) {
      const boardRow = [];
      for (let char of row) {
        if (isNaN(char)) {
          boardRow.push(char);
        } else {
          for (let i = 0; i < parseInt(char); i++) {
            boardRow.push('');
          }
        }
      }
      board.push(boardRow);
    }
    return board;
  };

  const getPieceImage = (piece) => {
    if (!piece) return null;
    const color = piece === piece.toUpperCase() ? 'w' : 'b';
    const pieceType = piece.toLowerCase();
    return `/pieces/${color}${pieceType}.svg`;
  };

  const getSquareCoordinates = (square) => {
    if (!square || square.length !== 2) return null;
    const file = square.charAt(0).toLowerCase();
    const rank = square.charAt(1);
    const fileIndex = 'abcdefgh'.indexOf(file);
    const rankIndex = '87654321'.indexOf(rank);
    return { fileIndex, rankIndex };
  };

  const board = fenToBoard(fen);
  const previousFen = findPreviousPosition();
  const lastMove = previousFen ? parseMove(move, previousFen) : null;
  const fromSquare = lastMove ? getSquareCoordinates(lastMove.from) : null;
  const toSquare = lastMove ? getSquareCoordinates(lastMove.to) : null;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className={`relative ${size === "full" ? "w-full" : "w-96"}`}>
      <div className="pb-6 pr-6">
        <div className="relative aspect-square">
          <img
            src="/board.png"
            alt="Chess Board"
            className="absolute top-0 left-0 w-full h-full"
          />

          {/* Move highlights */}
          {fromSquare && (
            <div
              className="absolute bg-yellow-500/40"
              style={{
                top: `${(fromSquare.rankIndex * 12.5)}%`,
                left: `${(fromSquare.fileIndex * 12.5)}%`,
                width: '12.5%',
                height: '12.5%'
              }}
            />
          )}
          {toSquare && (
            <div
              className="absolute bg-yellow-500/40"
              style={{
                top: `${(toSquare.rankIndex * 12.5)}%`,
                left: `${(toSquare.fileIndex * 12.5)}%`,
                width: '12.5%',
                height: '12.5%'
              }}
            />
          )}

          {/* Pieces */}
          <div className="absolute top-0 left-0 w-full h-full">
            {board.map((row, rowIndex) => (
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="absolute w-1/8 h-1/8"
                  style={{
                    top: `${(rowIndex * 12.5)}%`,
                    left: `${(colIndex * 12.5)}%`,
                    width: '12.5%',
                    height: '12.5%'
                  }}
                >
                  {piece && (
                    <img
                      src={getPieceImage(piece)}
                      alt={piece}
                      className="w-full h-full object-contain"
                      style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}
                    />
                  )}
                </div>
              ))
            ))}
          </div>

          {/* Coordinates */}
          <div className="absolute right-0 top-0 h-full -mr-6 w-6 flex flex-col">
            {ranks.map((rank) => (
              <div
                key={rank}
                className="flex-1 flex items-center justify-center text-sm font-medium"
                style={{ height: '12.5%' }}
              >
                {rank}
              </div>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 w-full -mb-6 h-6 flex">
            {files.map((file) => (
              <div
                key={file}
                className="flex-1 flex items-center justify-center text-sm font-medium"
                style={{ width: '12.5%' }}
              >
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
