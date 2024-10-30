import { Player } from '../models/Player';
import { Room } from '../models/Room';
import { db } from '../db/database';

function createRoom(player: Player): Room {
  const lengthRooms = db.getLengthRooms();
  const roomId = String(lengthRooms + 1);
  const newRoom = new Room(roomId);

  newRoom.addPlayer(player);
  db.addNewRoom(newRoom);
  console.log(`Create new room with ID: ${roomId}`);
  return newRoom;
}

function updateRoom(): void {
  const result: Room[] = [];
  const rooms = db.getAllRooms();
  rooms.forEach((room) => {
    if (!room.isFullRoom()) {
      result.push(room);
    }
  });

  const players: Player[] = db.getAllPlayers();
  players.forEach((player) => {
    player.ws.send(
      JSON.stringify({
        type: 'update_room',
        data: JSON.stringify(result),
        id: 0,
      }),
    );
  });
  console.log(`List rooms for game`);
}

export { createRoom, updateRoom };
