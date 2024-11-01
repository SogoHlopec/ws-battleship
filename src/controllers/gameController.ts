import { randomUUID, randomInt } from 'node:crypto';
import { Player } from '../models/Player';
import { Room } from '../models/Room';
import { Game, IShip } from '../models/Game';
import { sendUpdateWinners } from './playerController';
import { db } from '../db/database';
import { addUserToRoom, createRoom } from './roomController';

function createGame(room: Room): string {
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
    player.ws?.send(
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

  return gameId;
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
  console.log(game);

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
      item.player.ws?.send(
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
    item.player.ws?.send(
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
  attackingPlayerId: number | string,
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
          game.boards[attackingPlayerId][nx][ny].status === 'unknown'
        ) {
          game.boards[attackingPlayerId][nx][ny].status = 'miss';
          result.push({
            x: nx,
            y: ny,
            status: game.boards[attackingPlayerId][nx][ny].status,
          });
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
  attackingPlayerId: number | string,
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

  if (game.boards[attackingPlayerId][x][y].status !== 'unknown') {
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
      game.boards[attackingPlayerId][x][y].status = 'shot';
      status = 'shot';

      const isShipKilled = shipHit.cells.every((cell) => cell.isHit);
      if (isShipKilled) {
        status = 'killed';
        shipHit.cells.forEach((cell) => {
          game.boards[attackingPlayerId][cell.x][cell.y].status = 'killed';
        });

        const surroundingCells = markSurroundingCellsAsMiss(
          game,
          shipHit,
          attackingPlayerId,
        );

        game.players.forEach((item) => {
          shipHit.cells.forEach((cell) => {
            item.player.ws?.send(
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
            itemPlayer.player.ws?.send(
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
  game.boards[attackingPlayerId][x][y].status = 'miss';

  game.players.forEach(({ player }) => {
    player.ws?.send(
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

  console.log(`Player ${attackingPlayerId} attacked ${x}-${y}`);

  if (
    game.ships[enemy.idPlayer].every((ship) =>
      ship.cells.every((cell) => cell.isHit),
    )
  ) {
    finishGame(gameId, attackingPlayerId);
  }

  if (status !== 'shot' && status !== 'killed') {
    switchTurn(attackingPlayerId, game);
  }
}

function randomAttack(
  gameId: number | string,
  attackingPlayerId: string,
): void {
  const game = db.getGameById(gameId);

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return;
  }

  const availableCells = game.boards[attackingPlayerId]
    .flat()
    .filter((cell) => cell.status === 'unknown');

  if (availableCells.length === 0) {
    console.log(`No more cells available to attack in game ${gameId}.`);
    return;
  }

  const randomCell = availableCells[randomInt(availableCells.length)];
  const x = randomCell.position.x;
  const y = randomCell.position.y;

  console.log(`Player ${attackingPlayerId} random attacked ${x}-${y}`);

  handleAttack(gameId, x, y, attackingPlayerId);
}

function finishGame(
  gameId: number | string,
  winningPlayerId: number | string,
): void {
  const game = db.getGameById(gameId);

  if (!game) {
    console.log(`Game with ID ${gameId} not found.`);
    return;
  }

  game.players.forEach((item) => {
    item.player.ws?.send(
      JSON.stringify({
        type: 'finish',
        data: JSON.stringify({
          winPlayer: winningPlayerId,
        }),
        id: 0,
      }),
    );
  });

  console.log(
    `Game ${gameId} finished. Player ${winningPlayerId} is the winner.`,
  );

  const winnerPlayer = game.players.find(
    (item) => item.idPlayer === winningPlayerId,
  );
  if (winnerPlayer) {
    db.updateWinner(winnerPlayer.player.name);
    sendUpdateWinners();
  }
}

function handleSinglePlay(): void {
  const botId = `bot_${randomUUID()}`;
  const bot = new Player(botId, 'Bot', 'qwerty');
  const botShips: IShip[] = [
    {
      position: { x: 5, y: 9 },
      cells: [],
      direction: false,
      type: 'huge',
      length: 4,
    },
    {
      position: { x: 0, y: 6 },
      cells: [],
      direction: true,
      type: 'large',
      length: 3,
    },
    {
      position: { x: 2, y: 1 },
      cells: [],
      direction: true,
      type: 'large',
      length: 3,
    },
    {
      position: { x: 2, y: 7 },
      cells: [],
      direction: false,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 6, y: 2 },
      cells: [],
      direction: true,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 4, y: 3 },
      cells: [],
      direction: true,
      type: 'medium',
      length: 2,
    },
    {
      position: { x: 2, y: 9 },
      cells: [],
      direction: false,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 0, y: 4 },
      cells: [],
      direction: false,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 5, y: 0 },
      cells: [],
      direction: true,
      type: 'small',
      length: 1,
    },
    {
      position: { x: 0, y: 2 },
      cells: [],
      direction: false,
      type: 'small',
      length: 1,
    },
  ];

  const player = db.getAllPlayers()[0];
  if (!player) {
    console.log(`There are no players`);
    return;
  }
  const room = createRoom(player);
  const gameId = String(addUserToRoom(bot, room.roomId));
  console.log(gameId);

  if (!gameId) {
    console.log(`There's no game`);
    return;
  }

  const game = db.getGameById(gameId);
  if (!game) {
    console.log(`Game creation failed for single play.`);
    return;
  }

  console.log(`Game ${gameId} created for single play with bot ${botId}.`);

  const botGameId = game.getPlayerGameId(bot);
  const playerGameId = game.getPlayerGameId(player);

  if (botGameId) {
    addShipsToBoard(gameId, botGameId, botShips);
    startGame(gameId);
    botRandomAttack();
  }

  function botRandomAttack() {
    const x = randomInt(10);
    const y = randomInt(10);

    console.log(`Bot attacking at (${x}, ${y})`);

    if (botGameId && game) {
      handleAttack(gameId, x, y, botGameId);
      handleAttackWithBotCheck(gameId, botGameId);
      switchTurn(botGameId, game);
    }
  }

  function handleAttackWithBotCheck(
    gameId: number | string,
    playerId: number | string,
  ): void {
    const game = db.getGameById(gameId);
    if (!game) {
      console.log(`Game failed for single play.`);
      return;
    }

    const playerShips = game.ships[playerId];
    if (!playerShips) {
      console.log(`No ships found for player ${playerId}`);
      return;
    }

    const isFinish = game.ships[playerId].every((ship) =>
      ship.cells.every((cell) => cell.isHit),
    );

    if (!isFinish && game.currentPlayerId === botGameId) {
      setTimeout(botRandomAttack, 1000);
    } else {
      console.log(`Bot's turn finished or all ships are sunk.`);
    }
  }

  if (playerGameId) {
    setInterval(() => {
      handleAttackWithBotCheck(gameId, playerGameId);
    }, 1000);
  }
}

export {
  createGame,
  addShipsToBoard,
  startGame,
  sendTurnInfo,
  handleAttack,
  randomAttack,
  handleSinglePlay,
};
