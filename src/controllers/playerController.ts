import { IPlayer, Player } from '../models/Player';
import { db } from '../db/database';

function registerPlayer(
  clientId: string,
  name: string,
  password: string,
): IPlayer | null {
  const validatePlayer = db.isValidatePlayer(name);
  if (!validatePlayer) {
    console.log(`Player ${name} already exists.`);
    return null;
  }

  const newPlayer = new Player(clientId, name, password);
  db.addNewPlayer(newPlayer);
  console.log(`Player ${name} registered with ID: ${newPlayer.id}`);
  return newPlayer;
}

export { registerPlayer };
