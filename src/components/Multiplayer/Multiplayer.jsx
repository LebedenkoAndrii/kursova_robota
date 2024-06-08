import React, { useState } from "react";
import "./Multiplayer.css";

const Multiplayer = ({ rooms, createRoom, joinRoom }) => {
  const [roomName, setRoomName] = useState("");

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      createRoom(roomName);
      setRoomName("");
    }
  };

  return (
    <div className="multiplayer">
      <ul className="room-list">
        {rooms.length === 0 ? (
          <p className="empty-list">No rooms</p>
        ) : (
          rooms.map((room) => (
            <li key={room.id} onClick={() => joinRoom(room.id)}>
              {"Room: " + room.name}
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
