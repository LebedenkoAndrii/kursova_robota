import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import GameBoard from "./components/GameBoard/GameBoard";
import Multiplayer from "./components/Multiplayer/Multiplayer";
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
      setGameStatus(`Гра з ${data.opponent}`);
      if (checkWin(data.gameBoard)) {
        socket.emit("gameOver", roomId);
      } else if (botPlaying && data.currentPlayer === "o") {
        botMove(data.gameBoard);
      }
    });

    socket.on("joinRoom", (id) => {
      setBotPlaying(false);
      setRoomId(id);
      setGameStatus(`Гра з людиною в кімнаті ${id}`);
    });

    socket.on("createRoom", (id) => {
      setBotPlaying(false);
      setRoomId(id);
      setGameStatus(`Гра з людиною в кімнаті ${id}`);
    });

    socket.on("gameOver", () => {
      setGameResult(`Гра закінчена!`);
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
        setGameResult("Нічия!");
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
        setGameResult(`Перемога ${board[a]}!`);
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

  return (
    <>
      <h1>Tic Tac Toe</h1>
      <div className="container">
        <div className="game">
          <GameBoard gameBoard={gameBoard} makeMove={makeMove} />
          <div className="game_info">
            <p id="game_status">{gameStatus}</p>
            <p id="game_result">{gameResult}</p>
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
