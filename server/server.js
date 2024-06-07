import express from "express";
const app = express();
import  server from ("http").createServer(app);
import io from ("socket.io")(server);

app.use(express.static("public"));

let rooms = [];

io.on("connection", (socket) => {
  console.log("New connection");

  // Отримання списку кімнат
  socket.emit("roomList", rooms);

  // Створення кімнати
  socket.on("createRoom", (roomName) => {
    const roomId = Math.random().toString(36).substr(2, 9);
    rooms.push({
      id: roomId,
      name: roomName,
      gameBoard: new Array(9).fill(null),
    });
    socket.emit("createRoom", roomId);
    io.emit("roomList", rooms); // Оновити список кімнат для всіх клієнтів
  });

  // Приєднання до кімнати
  socket.on("joinRoom", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      socket.join(roomId);
      socket.emit("joinRoom", roomId);
    }
  });

  // Відправка ходу до сервера
  socket.on("makeMove", (roomId, cellIndex, currentPlayer) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard[cellIndex] = currentPlayer;
      io.to(roomId).emit("gameResult", {
        gameBoard: room.gameBoard,
        currentPlayer: currentPlayer === "x" ? "o" : "x",
        opponent: "гравець",
      });
    }
  });

  // Отримання результату гри
  socket.on("gameOver", (roomId) => {
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      room.gameBoard = new Array(9).fill(null);
      io.to(roomId).emit("gameOver");
    }
  });
});

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
