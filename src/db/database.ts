import { IPlayer, Player } from '../models/Player';
import { Room } from '../models/Room';

class Database {
  private players: Player[] = [];
  private rooms: Room[] = [];
  private winners: { name: string; wins: number }[] = [];

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
      return item.index === index;
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

  public getRoomByIndex(index: number | string): Room | undefined {
    return this.rooms.find((room) => room.roomId === index);
  }

  public updateWinner(name: string): void {
    const winner = this.winners.find((item) => {
      return item.name === name;
    });

    if (winner) {
      winner.wins += 1;
    } else {
      this.winners.push({ name, wins: 1 });
    }
  }

  public getWinners(): { name: string; wins: number }[] {
    return this.winners;
  }
}

const db = new Database();
export { db };
