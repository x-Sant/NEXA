import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Client emits 'join' with their userId to join a specific room
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    if (data && data.userId) {
      client.join(`user-${data.userId}`);
      console.log(`Client ${client.id} joined room user-${data.userId}`);
    }
  }

  // Utility method for other services to send notifications
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
  }

  sendNotificationToAll(notification: any) {
    this.server.emit('notification', notification);
  }
}

