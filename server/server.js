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

const rooms = [];

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
      io.to(roomId).emit("gameResult", {
        gameBoard: room.gameBoard,
        currentPlayer: currentPlayer === "x" ? "o" : "x",
        opponent: "Player",
      });

      if (checkWin(room.gameBoard)) {
        io.to(roomId).emit("gameOver", { message: "Game over! You win!" });
      } else if (checkDraw(room.gameBoard)) {
        io.to(roomId).emit("gameOver", { message: "Game over! It's a draw!" });
      }
    }
  });

  socket.on("resetGame", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard = new Array(9).fill(null);
      io.to(roomId).emit("gameReset");
    }
  });

  socket.on("gameOver", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard = new Array(9).fill(null);
      io.to(roomId).emit("gameOver");
    }
  });
});

server.listen(3001, () => {
  console.log("Server started on port 3001");
});
