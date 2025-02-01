import React from 'react';

const ChessBoard = ({ fen, size = "full" }) => {
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

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const board = fenToBoard(fen);

  return (
    <div className={`relative ${size === "full" ? "w-full" : "w-96"}`}>
      {/* Coordinate wrapper - adds padding for coordinates */}
      <div className="pb-6 pr-6">
        <div className="relative aspect-square">
          {/* Board background */}
          <img
            src="/board.png"
            alt="Chess Board"
            className="absolute top-0 left-0 w-full h-full"
          />

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

          {/* Rank coordinates (numbers) */}
          <div className="absolute right-0 top-0 h-full -mr-6 w-6 flex flex-col">
            {ranks.map((rank, index) => (
              <div
                key={rank}
                className="flex-1 flex items-center justify-center text-sm font-medium"
                style={{ height: '12.5%' }}
              >
                {rank}
              </div>
            ))}
          </div>

          {/* File coordinates (letters) */}
          <div className="absolute bottom-0 left-0 w-full -mb-6 h-6 flex">
            {files.map((file, index) => (
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
