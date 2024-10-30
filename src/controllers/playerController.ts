import WebSocket from 'ws';
import { IPlayer, Player } from '../models/Player';
import { db } from '../db/database';

function registerPlayer(
  clientId: string,
  ws: WebSocket,
  name: string,
  password: string,
): void {
  const validatePlayer = db.isValidatePlayer(name);
  if (!validatePlayer) {
    console.log(`Player ${name} already exists.`);
  }

  const newPlayer = new Player(clientId, ws, name, password);
  db.addNewPlayer(newPlayer);
  console.log(`Player ${name} registered with ID: ${newPlayer.index}`);
  if (newPlayer) {
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: newPlayer.name,
          index: newPlayer.index,
          error: false,
          errorText: '',
        }),
        id: 0,
      }),
    );
  } else {
    ws.send(
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: '',
          index: null,
          error: true,
          errorText: 'Player already exists',
        }),
        id: 0,
      }),
    );
  }
}

export { registerPlayer };
