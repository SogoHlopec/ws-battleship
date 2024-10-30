import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import { httpServer } from './src/http_server/index';
import { handleWebSocketMessage } from './src/routes/router';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const port = 3000;
const wsServer = new WebSocketServer({ port });

wsServer.on('connection', (ws: WebSocket) => {
  const clientId = randomUUID();
  console.log(`New client with id ${clientId} connected`);

  ws.on('message', (message: string) => {
    message = message.toString();
    console.log(`Message clientId ${clientId}: ${JSON.stringify(message)}`);
    handleWebSocketMessage(clientId, ws, message);
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
