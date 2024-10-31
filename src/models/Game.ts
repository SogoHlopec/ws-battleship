import { Player } from './Player';

interface IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];
}

interface IShip {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

class Game implements IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];
  ships: { [playerId: number | string]: IShip[] } = {};

  constructor(
    gameId: number | string,
    players: { idPlayer: number | string; player: Player }[],
    ships: { [playerId: number | string]: IShip[] } = {},
  ) {
    this.gameId = gameId;
    this.players = players;
    players.forEach((item) => {
      this.ships[item.idPlayer] = [];
    });
  }

  public addShips(playerId: number | string, ships: IShip[]): boolean {
    if (!this.ships[playerId]) {
      console.log(`Player with ID ${playerId} is not in this game.`);
      return false;
    }
    this.ships[playerId] = ships;
    return true;
  }
}

export { IGame, Game, IShip };
