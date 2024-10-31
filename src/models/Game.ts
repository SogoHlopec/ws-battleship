import { Player } from './Player';

interface IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];
}

class Game implements IGame {
  gameId: number | string;
  players: { idPlayer: number | string; player: Player }[];

  constructor(
    gameId: number | string,
    players: { idPlayer: number | string; player: Player }[],
  ) {
    this.gameId = gameId;
    this.players = players;
  }
}

export { IGame, Game };
