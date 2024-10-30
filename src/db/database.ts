import { IPlayer, Player } from '../models/Player';
import { Room } from '../models/Room';

class Database {
  private players: Player[] = [];
  private rooms: Room[] = [];

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

  public getPlayerByIndex(index: string): Player | undefined {
    const player = this.players.find((item) => {
      if (item.index === index) {
        return item;
      } else {
        return null;
      }
    });
    return player;
  }

  public getAllPlayers(): Player[] {
    return this.players;
  }

  public addNewRoom(newRoom: Room): boolean {
    this.rooms.push(newRoom);
    return true;
  }

  public getLengthRooms(): number {
    return this.rooms.length;
  }

  public getAllRooms(): Room[] {
    return this.rooms;
  }
}

const db = new Database();
export { db };
