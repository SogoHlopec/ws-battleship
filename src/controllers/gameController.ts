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

function switchTurn(attackingPlayerId: number | string, game: Game): void {
  game.players.forEach((item) => {
    if (attackingPlayerId === game.currentPlayerId) {
      game.currentPlayerId = item.idPlayer;
    }
  });
  sendTurnInfo(game);
}

function markSurroundingCellsAsMiss(
  game: Game,
  ship: IShip,
): { x: number; y: number; status: string }[] {
  const result: { x: number; y: number; status: string }[] = [];
  ship.cells.forEach((item) => {
    const x = item.x;
    const y = item.y;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 &&
          nx < 10 &&
          ny >= 0 &&
          ny < 10 &&
          game.board[nx][ny].status === 'unknown'
        ) {
          game.board[nx][ny].status = 'miss';
          result.push({ x: nx, y: ny, status: game.board[nx][ny].status });
        }
      }
    }
  });

  return result;
}

function handleAttack(
  gameId: number | string,
  x: number,
  y: number,
  attackingPlayerId: string,
): void {
  const game = db.getGameById(gameId);

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return;
  }

  if (attackingPlayerId !== game.currentPlayerId) {
    console.log(`Another player's turn.`);
    return;
  }

  if (game.board[x][y].status !== 'unknown') {
    console.log(`They've already shot this cell ${x}-${y}.`);
    return;
  }

  const enemy = game.players.find(
    (item) => item.idPlayer !== attackingPlayerId,
  );
  if (!enemy) {
    console.log(`Enemy player not found for game ID ${gameId}.`);
    return;
  }

  const shipHit = game.ships[enemy.idPlayer].find((ship) =>
    ship.cells.some((cell) => cell.x === x && cell.y === y),
  );

  let status: 'miss' | 'shot' | 'killed' = 'miss';

  if (shipHit) {
    const cellHit = shipHit.cells.find((cell) => cell.x === x && cell.y === y);
    if (cellHit) {
      cellHit.isHit = true;
      game.board[x][y].status = 'shot';
      status = 'shot';

      const isShipKilled = shipHit.cells.every((cell) => cell.isHit);
      if (isShipKilled) {
        status = 'killed';
        shipHit.cells.forEach((cell) => {
          game.board[cell.x][cell.y].status = 'killed';
        });

        const surroundingCells = markSurroundingCellsAsMiss(game, shipHit);

        game.players.forEach((item) => {
          shipHit.cells.forEach((cell) => {
            item.player.ws.send(
              JSON.stringify({
                type: 'attack',
                data: JSON.stringify({
                  position: { x: cell.x, y: cell.y },
                  currentPlayer: attackingPlayerId,
                  status: 'killed',
                }),
                id: 0,
              }),
            );
          });
        });

        surroundingCells.forEach((item) => {
          game.players.forEach((itemPlayer) => {
            itemPlayer.player.ws.send(
              JSON.stringify({
                type: 'attack',
                data: JSON.stringify({
                  position: { x: item.x, y: item.y },
                  currentPlayer: attackingPlayerId,
                  status: item.status,
                }),
                id: 0,
              }),
            );
          });
        });
      }
    }
  }
  game.board[x][y].status = 'miss';

  game.players.forEach(({ player }) => {
    player.ws.send(
      JSON.stringify({
        type: 'attack',
        data: JSON.stringify({
          position: { x: x, y: y },
          currentPlayer: attackingPlayerId,
          status: status,
        }),
        id: 0,
      }),
    );
  });

  if (status !== 'shot' && status !== 'killed') {
    switchTurn(attackingPlayerId, game);
  }
}

export { createGame, addShipsToBoard, startGame, sendTurnInfo, handleAttack };
