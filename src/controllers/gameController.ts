import WebSocket from 'ws';
import { randomUUID } from 'node:crypto';
import { Player } from '../models/Player';
import { Room } from '../models/Room';
import { Game, IShip } from '../models/Game';
import { db } from '../db/database';

function createGame(room: Room): void {
  const gameId = randomUUID();

  const playersWithIds: { idPlayer: number | string; player: Player }[] = [];

  room.roomUsers.forEach((player) =>
    playersWithIds.push({
      idPlayer: randomUUID(),
      player: player,
    }),
  );

  const newGame = new Game(gameId, playersWithIds);
  db.addNewGame(newGame);

  playersWithIds.forEach(({ idPlayer, player }) => {
    player.ws.send(
      JSON.stringify({
        type: 'create_game',
        data: JSON.stringify({
          idGame: gameId,
          idPlayer: idPlayer,
        }),
        id: 0,
      }),
    );
    console.log(`Game created with ID ${gameId} for player ${player.name}`);
  });
}

function addShipsToBoard(
  gameId: number | string,
  playerId: number | string,
  ships: IShip[],
): boolean {
  const game = db.getGameById(gameId);

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return false;
  }

  const playerExists = game.players.some((item) => item.idPlayer === playerId);
  if (!playerExists) {
    console.log(
      `Player with ID ${playerId} is not part of the game ${gameId}.`,
    );
    return false;
  }

  const result = game.addShips(playerId, ships);
  if (result) {
    console.log(
      `Ships added for player with ID ${playerId} in game ${gameId}.`,
    );
  }
  return true;
}

function startGame(gameId: number | string): boolean {
  const game = db.getGameById(gameId);

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return false;
  }

  const hasTwoPlayersAddedShips = Object.values(game.ships).every(
    (ships) => Array.isArray(ships) && ships.length > 0,
  );

  if (game.players.length === 2 && hasTwoPlayersAddedShips) {
    game.currentPlayerId = game.players[0].idPlayer;

    game.players.forEach((item) => {
      item.player.ws.send(
        JSON.stringify({
          type: 'start_game',
          data: JSON.stringify({
            currentPlayerIndex: item.idPlayer,
            ships: game.ships[item.idPlayer],
          }),
          id: 0,
        }),
      );
    });

    console.log(`Start game ${gameId}.`);
    sendTurnInfo(game);
  } else {
    console.log(`Not all players have sent ships in the game ${gameId}.`);
    return false;
  }
  return true;
}

function sendTurnInfo(game: Game): void {
  game.players.forEach((item) => {
    item.player.ws.send(
      JSON.stringify({
        type: 'turn',
        data: JSON.stringify({
          currentPlayer: game.currentPlayerId,
        }),
        id: 0,
      }),
    );
  });

  console.log(`Turn player ${game.currentPlayerId}.`);
}

export { createGame, addShipsToBoard, startGame, sendTurnInfo };
