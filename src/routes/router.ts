import WebSocket from 'ws';
import { registerPlayer } from '../controllers/playerController';
import { IPlayer } from 'src/models/Player';

function handleWebSocketMessage(
  clientId: string,
  ws: WebSocket,
  message: string,
) {
  const parseMessage = JSON.parse(message.toString());
  const type = parseMessage.type;
  const data = JSON.parse(parseMessage.data);

  switch (type) {
    case 'reg': {
      const name: string = data.name;
      const password: string = data.password;
      const newPlayer: IPlayer | null = registerPlayer(
        clientId,
        name,
        password,
      );

      if (newPlayer) {
        ws.send(
          JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name: newPlayer.name,
              index: newPlayer.id,
              error: false,
              errorText: '',
            }),
            id: 0,
          }),
        );
      } else {
        ws.send(
          JSON.stringify({
            type: 'reg',
            data: JSON.stringify({
              name: '',
              index: null,
              error: true,
              errorText: 'Player already exists',
            }),
            id: 0,
          }),
        );
      }
      break;
    }
    default:
      console.log(`Unknown command: ${type}`);
      break;
  }
}

export { handleWebSocketMessage };
