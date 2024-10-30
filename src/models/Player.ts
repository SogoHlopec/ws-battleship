interface IPlayer {
  id: string;
  name: string;
  password: string;
}

class Player implements IPlayer {
  id: string;
  name: string;
  password: string;

  constructor(clientId: string, name: string, password: string) {
    this.id = clientId;
    this.name = name;
    this.password = password;
  }
}

export { IPlayer, Player };
