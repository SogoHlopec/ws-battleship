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
import {
  addShipsToBoard,
  startGame,
  handleAttack,
  randomAttack,
} from '../controllers/gameController';
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
      startGame(data.gameId);
      break;
    }
    case 'attack': {
      const data = JSON.parse(parseMessage.data);

      handleAttack(data.gameId, data.x, data.y, data.indexPlayer);
      break;
    }
    case 'randomAttack': {
      const data = JSON.parse(parseMessage.data);

      randomAttack(data.gameId, data.indexPlayer);
      break;
    }
    default:
      console.log(`Unknown command: ${type}`);
      break;
  }
}

export { handleWebSocketMessage };
