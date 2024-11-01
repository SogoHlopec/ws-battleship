import { Player } from './Player';

interface IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];
  ships: { [playerId: number | string]: IShip[] };
  currentPlayerId: number | string;
  boards: {
    [playerId: number | string]: {
      position: { x: number; y: number };
      status: 'unknown' | 'miss' | 'shot' | 'killed';
    }[][];
  };
}

interface IShip {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
  cells: { x: number; y: number; isHit: boolean }[];
}

class Game implements IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];
  ships: { [playerId: number | string]: IShip[] } = {};
  currentPlayerId: number | string;
  boards: {
    [playerId: number | string]: {
      position: { x: number; y: number };
      status: 'unknown' | 'miss' | 'shot' | 'killed';
    }[][];
  } = {};

  constructor(
    gameId: number | string,
    players: { idPlayer: number | string; player: Player }[],
    ships: { [playerId: number | string]: IShip[] } = {},
    boards: {
      [playerId: number | string]: {
        position: { x: number; y: number };
        status: 'unknown' | 'miss' | 'shot' | 'killed';
      }[][];
    } = {},
  ) {
    this.gameId = gameId;
    this.players = players;
    this.currentPlayerId = '';

    players.forEach((item) => {
      this.ships[item.idPlayer] = [];

      this.boards[item.idPlayer] = Array.from({ length: 10 }, (_, x) =>
        Array.from({ length: 10 }, (_, y) => ({
          position: { x, y },
          status: 'unknown',
        })),
      );
    });
  }

  public addShips(playerId: number | string, ships: IShip[]): boolean {
    if (!this.ships[playerId]) {
      console.log(`Player with ID ${playerId} is not in this game.`);
      return false;
    }

    ships.forEach((ship) => {
      ship.cells = [];
      for (let i = 0; i < ship.length; i++) {
        if (ship.direction) {
          const x = ship.position.x;
          const y = ship.position.y + i;
          ship.cells.push({ x: x, y: y, isHit: false });
        } else {
          const x = ship.position.x + i;
          const y = ship.position.y;
          ship.cells.push({ x: x, y: y, isHit: false });
        }
      }
    });
    this.ships[playerId] = ships;
    console.log(ships);
    return true;
  }
}

export { IGame, Game, IShip };
