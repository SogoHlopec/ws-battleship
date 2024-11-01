import WebSocket from 'ws';

interface IPlayer {
  index: string;
  name: string;
  password: string;
  ws?: WebSocket;
}

class Player implements IPlayer {
  public index: string;
  public name: string;
  public password: string;
  public ws?: WebSocket;

  constructor(
    clientId: string,
    name: string,
    password: string,
    ws?: WebSocket,
  ) {
    this.index = clientId;
    this.name = name;
    this.password = password;
    this.ws = ws;
  }
}

export { IPlayer, Player };
