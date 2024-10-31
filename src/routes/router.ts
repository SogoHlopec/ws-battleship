import WebSocket from 'ws';
import { Player } from '../models/Player';
import {
  registerPlayer,
  sendUpdateWinners,
} from '../controllers/playerController';
import {
  createRoom,
  updateRoom,
  addUserToRoom,
} from '../controllers/roomController';
import { addShipsToBoard } from '../controllers/gameController';
import { db } from '../db/database';

function handleWebSocketMessage(
  clientId: string,
  ws: WebSocket,
  message: string,
) {
  const parseMessage = JSON.parse(message.toString());
  const type = parseMessage.type;
  const player: Player | undefined = db.getPlayerByIndex(clientId);

  switch (type) {
    case 'reg': {
      const data = JSON.parse(parseMessage.data);
      const name: string = data.name;
      const password: string = data.password;
      registerPlayer(clientId, ws, name, password);
      updateRoom();
      sendUpdateWinners();
      break;
    }
    case 'create_room': {
      if (player) {
        createRoom(player);
        updateRoom();
      }
      break;
    }

    case 'add_user_to_room': {
      const data = JSON.parse(parseMessage.data);
      const indexRoom = data.indexRoom;

      if (player) {
        addUserToRoom(player, indexRoom);
      }
      break;
    }

    case 'add_ships': {
      const data = JSON.parse(parseMessage.data);

      addShipsToBoard(data.gameId, data.indexPlayer, data.ships);
      break;
    }
    default:
      console.log(`Unknown command: ${type}`);
      break;
  }
}

export { handleWebSocketMessage };
