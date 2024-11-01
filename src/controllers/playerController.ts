import WebSocket from 'ws';
import { Player } from '../models/Player';
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

  const newPlayer = new Player(clientId, name, password, ws);
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

function sendUpdateWinners(): void {
  const winners = db.getWinners();
  const players: Player[] = db.getAllPlayers();

  players.forEach((player) => {
    player.ws?.send(
      JSON.stringify({
        type: 'update_winners',
        data: JSON.stringify(winners),
        id: 0,
      }),
    );
  });
  console.log(`Update winners successfully`);
}

export { registerPlayer, sendUpdateWinners };
