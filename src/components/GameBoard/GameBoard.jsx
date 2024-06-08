import React from "react";
import "./GameBoard.css";

const GameBoard = ({ gameBoard, makeMove }) => {
  return (
    <div className="game_board">
      {gameBoard.map((cell, index) => (
        <div
          key={index}
          className={`cell ${cell}`}
          onClick={() => makeMove(index)}
        >
          <p>{cell}</p>
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
