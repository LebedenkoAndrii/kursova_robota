import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import GameBoard from "./components/GameBoard/GameBoard";
import Multiplayer from "./components/Multiplayer/Multiplayer";
import resetIcon from "./assets/icons/reset.png";
import "./App.css";

const socket = io("http://localhost:3001");

const App = () => {
  const [gameBoard, setGameBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("x");
  const [gameStatus, setGameStatus] = useState("Game with BOT");
  const [gameResult, setGameResult] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [botPlaying, setBotPlaying] = useState(true);

  useEffect(() => {
    socket.on("roomList", (rooms) => {
      setRooms(rooms);
    });

    socket.on("gameResult", (data) => {
      setGameBoard(data.gameBoard);
      setCurrentPlayer(data.currentPlayer);
      setGameStatus(`Game with ${data.opponent}`);
      if (checkWin(data.gameBoard)) {
        socket.emit("gameOver", roomId);
      } else if (botPlaying && data.currentPlayer === "o") {
        botMove(data.gameBoard);
      }
    });

    socket.on("joinRoom", (id) => {
      setBotPlaying(false);
      setRoomId(id);
      setGameStatus(`Play with friend in room: ${id}`);
    });

    socket.on("createRoom", (id) => {
      setBotPlaying(false);
      setRoomId(id);
      setGameStatus(`Play with human in room: ${id}`);
    });

    socket.on("gameOver", () => {
      setGameResult(`Game over!`);
    });
  }, [botPlaying, roomId]);

  const createRoom = (roomName) => {
    socket.emit("createRoom", roomName);
  };

  const joinRoom = (id) => {
    socket.emit("joinRoom", id);
  };

  const makeMove = (cellIndex) => {
    if (gameBoard[cellIndex] === null && !gameResult) {
      const newBoard = [...gameBoard];
      newBoard[cellIndex] = currentPlayer;
      setGameBoard(newBoard);
      if (checkWin(newBoard)) {
        socket.emit("gameOver", roomId);
      } else if (checkDraw(newBoard)) {
        setGameResult("Draw!");
        socket.emit("gameOver", roomId);
      } else {
        const nextPlayer = currentPlayer === "x" ? "o" : "x";
        setCurrentPlayer(nextPlayer);
        if (roomId) {
          socket.emit("makeMove", roomId, cellIndex, currentPlayer);
        } else {
          setTimeout(() => botMove(newBoard), 300);
        }
      }
      if (checkWin(room.gameBoard)) {
        io.to(roomId).emit("gameOver", { message: "Game over! You win!" });
      } else if (checkDraw(room.gameBoard)) {
        io.to(roomId).emit("gameOver", { message: "Game over! It's a draw!" });
      }
    }
  };

  const checkWin = (board) => {
    const winConditions = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let condition of winConditions) {
      const [a, b, c] = condition;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setGameResult(`Victory ${board[a]}!`);
        return true;
      }
    }
    return false;
  };

  const checkDraw = (board) => {
    return board.every((cell) => cell !== null);
  };

  const botMove = (board) => {
    const emptyCells = board
      .map((cell, index) => (cell === null ? index : null))
      .filter((cell) => cell !== null);
    if (emptyCells.length > 0) {
      const randomCell =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const newBoard = [...board];
      newBoard[randomCell] = "o";
      setGameBoard(newBoard);
      if (!checkWin(newBoard)) {
        setCurrentPlayer("x");
        socket.emit("makeMove", roomId, randomCell, "o");
      }
    }
  };

  const resetGame = () => {
    setGameBoard(Array(9).fill(null));
    setCurrentPlayer("x");
    setGameStatus(
      botPlaying
        ? "Game with BOT"
        : `Play with ${roomId ? "friend in room: " + roomId : "BOT"}`
    );
    setGameResult("");
    if (roomId) {
      socket.emit("resetGame", roomId);
    }
  };

  return (
    <>
      <h1>Tic Tac Toe</h1>
      <div className="container">
        <div className="game">
          <GameBoard gameBoard={gameBoard} makeMove={makeMove} />
          <div className="game_info">
            <p id="game_status">{gameStatus}</p>
            <p id="game_result">{gameResult}</p>
            <button className="reset-button" onClick={resetGame}>
              Reset Game{" "}
              <img className="reset-icon" src={resetIcon} alt="reset" />
            </button>
          </div>
        </div>
        <div className="multiplayer">
          <h2>Multiplayer</h2>
          <Multiplayer
            rooms={rooms}
            createRoom={createRoom}
            joinRoom={joinRoom}
          />
        </div>
      </div>
    </>
  );
};

export default App;
