import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./Multiplayer.css";

const socket = io("http://localhost:3001");

const Multiplayer = ({ rooms, createRoom, joinRoom }) => {
  const [roomName, setRoomName] = useState("");

  useEffect(() => {
    socket.on("roomList", (rooms) => {
      setRooms(rooms);
    });

    return () => {
      socket.off("roomList");
    };
  }, []);

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName);
      setRoomName("");
    }
  };

  const deleteRoom = (roomId) => {
    socket.emit("deleteRoom", roomId); // Відправляємо подію на сервер для видалення кімнати
  };

  return (
    <div className="multiplayer">
      <ul className="room-list">
        {rooms.length === 0 ? (
          <p className="empty-list">No rooms</p>
        ) : (
          rooms.map((room) => (
            <li key={room.id}>
              <span onClick={() => joinRoom(room.id)}>
                {"Room: " + room.name}
              </span>
              <button onClick={() => deleteRoom(room.id)}>Delete</button>{" "}
            </li>
          ))
        )}
      </ul>
      <div className="create-room">
        <input
          className="input_mp"
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Enter a name of room"
        />
        <button className="create_btn" type="button" onClick={handleCreateRoom}>
          Create a room
        </button>
      </div>
    </div>
  );
};

export default Multiplayer;
