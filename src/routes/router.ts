import WebSocket from 'ws';
import { IPlayer, Player } from 'src/models/Player';
import { Room } from 'src/models/Room';
import {
  registerPlayer,
  sendUpdateWinners,
} from '../controllers/playerController';
import { createRoom, updateRoom } from 'src/controllers/roomController';
import { db } from 'src/db/database';

function handleWebSocketMessage(
  clientId: string,
  ws: WebSocket,
  message: string,
) {
  const parseMessage = JSON.parse(message.toString());
  const type = parseMessage.type;

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
    case 'create_room':
      const player: Player | undefined = db.getPlayerByIndex(clientId);
      if (player) {
        createRoom(player);
        updateRoom();
      }
      break;
    default:
      console.log(`Unknown command: ${type}`);
      break;
  }
}

export { handleWebSocketMessage };
