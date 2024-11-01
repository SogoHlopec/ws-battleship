import { Player } from '../models/Player';
import { Room } from '../models/Room';
import { createGame } from './gameController';
import { db } from '../db/database';

function createRoom(player: Player): Room {
  const lengthRooms = db.getLengthRooms();
  const roomId = lengthRooms + 1;
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
    player.ws?.send(
      JSON.stringify({
        type: 'update_room',
        data: JSON.stringify(result),
        id: 0,
      }),
    );
  });
  console.log(`Update room successfully`);
}

function addUserToRoom(
  player: Player,
  roomId: number | string,
): boolean | void | string{
  const room = db.getRoomByIndex(roomId);

  if (!room) {
    console.log(`Room with index ${roomId} not found.`);
    return false;
  }

  if (room.isFullRoom()) {
    console.log(`Room ${roomId} is already full.`);
    return false;
  }

  if (room.isExistPlayerInRoom(player.index)) {
    console.log(`Player ${player.name} is already in the room ${roomId}.`);
    return false;
  }

  room.roomUsers.push(player);
  console.log(`Player ${player.name} added to room ${roomId}`);

  let gameId = '';
  if (room.roomUsers.length === 2) {
    updateRoom();
    gameId = createGame(room);
  }

  return gameId;
}

export { createRoom, updateRoom, addUserToRoom };
