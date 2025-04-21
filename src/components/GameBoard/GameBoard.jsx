import React from "react";
import "./GameBoard.css";

const GameBoard = ({ gameBoard, makeMove, gridSize }) => {
  return (
    <div
      className="game_board"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {gameBoard.map((cell, index) => (
        <div
          key={index}
          className={`cell ${cell ? cell : ""}`}
          onClick={() => makeMove(index)}
        >
          <p>{cell}</p>
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
