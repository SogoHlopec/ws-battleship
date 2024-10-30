import { Player } from './Player';

interface IRoom {
  roomId: string;
  roomUsers: Player[];
}

class Room implements IRoom {
  public roomId: string;
  public roomUsers: Player[];

  constructor(roomId: string) {
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
    return this.getLengthRoomUsers() > 1 ? true : false;
  }
}

export { IRoom, Room };
