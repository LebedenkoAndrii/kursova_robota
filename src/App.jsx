import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import GameBoard from "./components/GameBoard/GameBoard";
import Multiplayer from "./components/Multiplayer/Multiplayer";
import Modal from "./components/Modal/Modal";
import { GrPowerReset } from "react-icons/gr";
import { TbDoorExit } from "react-icons/tb";
import "./App.css";

const socket = io("http://localhost:3001");

const App = () => {
  const [gridSize, setGridSize] = useState(3);
  const [selectedGridSize, setSelectedGridSize] = useState(3);
  const [gameBoard, setGameBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("x");
  const [gameStatus, setGameStatus] = useState("Game with BOT");
  const [gameResult, setGameResult] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const [botPlaying, setBotPlaying] = useState(true);
  const [player1Wins, setPlayer1Wins] = useState(0);
  const [player2Wins, setPlayer2Wins] = useState(0);
  const [botWins, setBotWins] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    socket.on("roomList", (rooms) => {
      setRooms(rooms);
    });

    socket.on("gameResult", (data) => {
      setGameBoard(data.gameBoard);
      setCurrentPlayer(data.currentPlayer);
      setGameStatus(`Game with ${data.opponent}`);
      if (data.result !== "") {
        setGameResult(data.result);
      }
      if (botPlaying && data.currentPlayer === "o" && data.result === "") {
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

    socket.on("gameOver", (winner) => {
      setTotalGames((prev) => prev + 1);
      if (winner) {
        setModalMessage(
          `Player ${winner === "x" ? 1 : 2} won! Congratulations!`
        );
      } else {
        setModalMessage("Draw! Try again :)");
      }
      setTimeout(() => setShowModal(true), 2000);
    });

    socket.on("roomDeleted", () => {
      resetToBotGame();
    });

    return () => {
      socket.off("roomList");
      socket.off("gameResult");
      socket.off("joinRoom");
      socket.off("createRoom");
      socket.off("gameOver");
      socket.off("roomDeleted");
    };
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
      socket.emit("makeMove", roomId, cellIndex, currentPlayer, newBoard);
      if (checkWin(newBoard)) {
        setGameResult(`Victory ${currentPlayer}!`);
        socket.emit("gameOver", roomId, currentPlayer);
        if (currentPlayer === "x") {
          setPlayer1Wins((prev) => prev + 1);
        } else if (currentPlayer === "o") {
          setPlayer2Wins((prev) => prev + 1);
        } else {
          setBotWins((prev) => prev + 1);
        }
        setTotalGames((prev) => prev + 1);
        setModalMessage(
          `Player ${currentPlayer === "x" ? 1 : 2} won! Congratulations!`
        );
        setTimeout(() => setShowModal(true), 2000);
      } else if (checkDraw(newBoard)) {
        setGameResult("Draw!");
        socket.emit("gameOver", roomId, null);
        setTotalGames((prev) => prev + 1);
        setModalMessage("Draw! Try again :)");
        setTimeout(() => setShowModal(true), 2000);
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
    const size = gridSize;
    const winConditions = [];

    // Rows
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(i * size + j);
      }
      winConditions.push(row);
    }

    // Columns
    for (let j = 0; j < size; j++) {
      const col = [];
      for (let i = 0; i < size; i++) {
        col.push(i * size + j);
      }
      winConditions.push(col);
    }

    // Diagonals
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < size; i++) {
      diag1.push(i * size + i);
      diag2.push(i * size + (size - 1 - i));
    }
    winConditions.push(diag1, diag2);

    for (let condition of winConditions) {
      const cells = condition.map((index) => board[index]);
      if (cells.every((cell) => cell && cell === cells[0])) {
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
      if (!checkWin(newBoard) && !checkDraw(newBoard)) {
        setCurrentPlayer("x");
        socket.emit("makeMove", roomId, randomCell, "o");
      } else {
        if (checkWin(newBoard)) {
          setGameResult("Victory o!");
          setBotWins((prev) => prev + 1);
          setModalMessage("Player o won! Congratulations!");
          setTimeout(() => setShowModal(true), 2000);
        } else if (checkDraw(newBoard)) {
          setGameResult("Draw!");
          setModalMessage("Draw! Try again :)");
          setTimeout(() => setShowModal(true), 2000);
        }
        setTotalGames((prev) => prev + 1);
      }
    }
  };

  const resetToBotGame = () => {
    setGameBoard(Array(gridSize * gridSize).fill(null));
    setCurrentPlayer("x");
    setGameStatus("Game with BOT");
    setGameResult("");
    setRoomId(null);
    setBotPlaying(true);
    setShowModal(false);
  };

  const resetGame = () => {
    setGridSize(selectedGridSize);
    setGameBoard(Array(selectedGridSize * selectedGridSize).fill(null));
    setCurrentPlayer("x");
    setGameStatus(
      botPlaying
        ? "Game with BOT"
        : `Play with ${roomId ? "friend in room: " + roomId : "BOT"}`
    );
    setGameResult("");
    setShowModal(false);
    if (roomId) {
      socket.emit("resetGame", roomId);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom", roomId);
    resetToBotGame();
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleGridSizeChange = (e) => {
    setSelectedGridSize(parseInt(e.target.value));
  };

  return (
    <>
      <h1>Tic Tac Toe</h1>
      <div className="container">
        <div className="game">
          <div className="players-info">
            <div className="player">
              <h3>Player 1</h3>
              <p>Symbol: X</p>
              <p>Wins: {player1Wins}</p>
            </div>
            <div className="player">
              <h3>{botPlaying ? "BOT" : "Player 2"}</h3>
              <p>Symbol: O</p>
              <p>Wins: {player2Wins}</p>
            </div>
          </div>
          <div className="game-controls">
            <label htmlFor="gridSize">Grid Size: </label>
            <select
              id="gridSize"
              value={selectedGridSize}
              onChange={handleGridSizeChange}
            >
              {[3, 4, 5, 6, 7, 8, 9].map((size) => (
                <option key={size} value={size}>
                  {size}x{size}
                </option>
              ))}
            </select>
          </div>
          <GameBoard
            gameBoard={gameBoard}
            makeMove={makeMove}
            gridSize={gridSize}
          />
          <div className="game_info">
            <p id="game_status">{gameStatus}</p>
            <p id="current_turn">
              Current turn: Player{" "}
              {currentPlayer === "x" ? 1 : botPlaying ? "BOT" : 2}
            </p>
            <p id="total_games">Total games played: {totalGames}</p>
            <p id="game_result">{gameResult}</p>
            <div className="r-l-row">
              <button className="reset-button" onClick={resetGame}>
                New Game <GrPowerReset />
              </button>
              <TbDoorExit className="exit-button" onClick={leaveRoom} />
            </div>
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
      {showModal && <Modal message={modalMessage} onClose={closeModal} />}
    </>
  );
};

export default App;
