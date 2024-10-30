import WebSocket from 'ws';

interface IPlayer {
  index: string;
  ws: WebSocket;
  name: string;
  password: string;
}

class Player implements IPlayer {
  public index: string;
  public ws: WebSocket;
  public name: string;
  public password: string;

  constructor(clientId: string, ws: WebSocket, name: string, password: string) {
    this.index = clientId;
    this.name = name;
    this.password = password;
    this.ws = ws;
  }
}

export { IPlayer, Player };
