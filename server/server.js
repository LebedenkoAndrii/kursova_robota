import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let rooms = [];

app.use(express.static("tic-tac-toe"));

io.on("connection", (socket) => {
  console.log("New connection");

  socket.emit("roomList", rooms);

  socket.on("createRoom", (roomName) => {
    const roomId = Math.random().toString(36).substr(2, 9);
    rooms.push({
      id: roomId,
      name: roomName,
      gameBoard: new Array(9).fill(null),
    });
    io.emit("roomList", rooms);
    socket.emit("createRoom", roomId);
  });

  socket.on("joinRoom", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      socket.join(roomId);
      socket.emit("joinRoom", roomId);
    }
  });

  socket.on("makeMove", (roomId, cellIndex, currentPlayer) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard[cellIndex] = currentPlayer;
      let result = "";
      if (checkWin(room.gameBoard, currentPlayer)) {
        result = `${currentPlayer} wins!`;
      } else if (checkDraw(room.gameBoard)) {
        result = "It's a draw!";
      }
      io.to(roomId).emit("gameResult", {
        gameBoard: room.gameBoard,
        currentPlayer: currentPlayer === "x" ? "o" : "x",
        opponent: "Player",
        result: result,
      });
    }
  });

  const checkWin = (board, currentPlayer) => {
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
      if (
        board[a] === currentPlayer &&
        board[a] === board[b] &&
        board[a] === board[c]
      ) {
        return true;
      }
    }
    return false;
  };

  socket.on("resetGame", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard = new Array(9).fill(null);
      io.to(roomId).emit("gameReset");
    }
  });

  socket.on("deleteRoom", (roomId) => {
    rooms = rooms.filter((room) => room.id !== roomId);
    io.to(roomId).emit("roomDeleted", {
      message: "The room has been deleted.",
    });
    io.emit("roomList", rooms);
  });

  socket.on("gameOver", (roomId, winner) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard = new Array(9).fill(null);
      io.to(roomId).emit("gameOver", winner);
    }
    console.log("game end");
  });
});

const checkDraw = (board) => {
  return board.every((cell) => cell !== null);
};

server.listen(3001, () => {
  console.log("Server started on port 3001");
});
