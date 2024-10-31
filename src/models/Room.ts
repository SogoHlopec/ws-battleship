import { Player } from './Player';

interface IRoom {
  roomId: number | string;
  roomUsers: Player[];
}

class Room implements IRoom {
  public roomId: number | string;
  public roomUsers: Player[];

  constructor(roomId: number | string) {
    this.roomId = roomId;
    this.roomUsers = [];
  }

  public addPlayer(player: Player): void {
    this.roomUsers.push(player);
  }

  public getLengthRoomUsers(): number {
    return this.roomUsers.length;
  }

  public isFullRoom(): boolean {
    return this.getLengthRoomUsers() >= 2 ? true : false;
  }

  public isExistPlayerInRoom(playerIndex: string): boolean {
    return this.roomUsers.some((item) => item.index === playerIndex);
  }
}

export { IRoom, Room };
