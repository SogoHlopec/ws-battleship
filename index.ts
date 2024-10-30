import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import { httpServer } from './src/http_server/index';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const port = 3000;
const wsServer = new WebSocketServer({ port });

wsServer.on('connection', (ws: WebSocket) => {
  const clientId = randomUUID();
  console.log(`New client with id ${clientId} connected`);

  ws.on('message', (message: string) => {
    const parseMessage = JSON.parse(message.toString());
    const type = parseMessage.type;
    const data = JSON.parse(parseMessage.data);
    console.log(
      `Message clientId ${clientId}: ${JSON.stringify(parseMessage)}`,
    );
  });

  ws.on('error', (error: Error) => {
    console.error(`WebSocket error clientId ${clientId}:`, error.message);
  });

  ws.on('close', () => {
    console.log(`Connection closed clientId ${clientId}`);
  });
});

wsServer.on('listening', () => {
  console.log(`WebSocket server is running on port ${port}`);
});

process.on('SIGINT', () => {
  console.log('The server has shut down');
  wsServer.close(() => {
    console.log('WebSocket server stopped');
    process.exit(0);
  });
  httpServer.close(() => {
    console.log('HTTP server stopped');
    process.exit(0);
  });
});
