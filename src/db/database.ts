import { IPlayer, Player } from '../models/Player';

class Database {
  private players: Player[] = [];

  public addNewPlayer(newPlayer: IPlayer): boolean {
    this.players.push(newPlayer);
    return true;
  }

  public isValidatePlayer(name: string): boolean {
    const existingPlayer = this.players.find((player) => {
      return player.name === name;
    });
    if (existingPlayer) {
      return false;
    } else {
      return true;
    }
  }
}

const db = new Database();
export { db };
