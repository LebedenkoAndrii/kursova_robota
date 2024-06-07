import React, { useState } from "react";

const Multiplayer = ({ rooms, createRoom, joinRoom }) => {
  const [roomName, setRoomName] = useState("");

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName);
      setRoomName("");
    }
  };

  return (
    <div>
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.id} onClick={() => joinRoom(room.id)}>
            {room.name}
          </li>
        ))}
      </ul>
      <div className="create-room">
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Введіть назву кімнати"
        />
        <button type="button" onClick={handleCreateRoom}>
          Створити кімнату
        </button>
      </div>
    </div>
  );
};

export default Multiplayer;
