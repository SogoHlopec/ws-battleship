import { IPlayer, Player } from '../models/Player';
import { Room } from '../models/Room';
import { Game } from 'src/models/Game';

class Database {
  private players: Player[] = [];
  private rooms: Room[] = [];
  private winners: { name: string; wins: number }[] = [];
  private games: Game[] = [];

  public addNewPlayer(newPlayer: IPlayer): boolean {
    this.players.push(newPlayer);
    return true;
  }

  public isValidatePlayer(name: string): boolean {
    const existingPlayer = this.players.find((player) => player.name === name);
    if (existingPlayer) {
      return false;
    } else {
      return true;
    }
  }

  public getPlayerByIndex(index: string): IPlayer | undefined {
    return this.players.find((item) => item.index === index);
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
    const winner = this.winners.find((item) => item.name === name);
    if (winner) {
      winner.wins += 1;
    } else {
      this.winners.push({ name, wins: 1 });
    }
  }

  public getWinners(): { name: string; wins: number }[] {
    return this.winners;
  }

  public addNewGame(newGame: Game): boolean {
    this.games.push(newGame);
    return true;
  }

  public getGameById(gameId: number | string): Game | undefined {
    return this.games.find((game) => game.gameId === gameId);
  }
}

const db = new Database();
export { db };
