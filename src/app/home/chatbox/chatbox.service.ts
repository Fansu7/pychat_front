import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { API_ENDPOINT } from '../../constants';

type UserLite = { id: number; username: string };
type MsgIn = { sender_nickname: string; receiver_id: number; content: string };
type MsgOut = { receiver_id: number; content: string };

@Injectable({ providedIn: 'root' })
export class ChatboxService {
  private socket: WebSocket | null = null;
  private selectedUserSource = new BehaviorSubject<UserLite | null>(null);
  private mensajeSubject = new Subject<MsgIn>();

  private readonly API_BASE = API_ENDPOINT;
  private readonly WS_BASE = this.API_BASE.replace(/^http/, 'ws');

  selectedUser$ = this.selectedUserSource.asObservable();

  constructor(private http: HttpClient) {}

  connect(userId: number): void {
    const url = `${this.WS_BASE}/ws/${userId}`;

    // evita abrir mil sockets
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WS abierto');
    };

    this.socket.onmessage = (event) => {
      try {
        const data: MsgIn = JSON.parse(event.data);
        this.mensajeSubject.next(data);
      } catch (e) {
        console.warn('WS mensaje no JSON', e);
      }
    };

    this.socket.onerror = (e) => {
      console.error('WS error', e);
    };

    this.socket.onclose = () => {
      console.log('WS cerrado');
    };
  }

  selectUser(user: UserLite | null) {
    this.selectedUserSource.next(user);
  }

  getMensajes(otherUserId: number) {
    return this.http.get<MsgIn[]>(`${this.API_BASE}/messages/${otherUserId}`);
  }

  enviarMensaje(mensaje: MsgOut) {
    const sendWS = () => {
      if (!this.socket) return false;
      const payload = {
        receiver_id: mensaje.receiver_id,
        message: mensaje.content,
      };
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(payload));
        return true;
      }
      if (this.socket.readyState === WebSocket.CONNECTING) {
        const handler = () => {
          try {
            this.socket?.send(JSON.stringify(payload));
          } finally {
            this.socket?.removeEventListener('open', handler);
          }
        };
        this.socket.addEventListener('open', handler, { once: true });
        return true;
      }
      return false;
    };

    return this.http.post(`${this.API_BASE}/messages/`, mensaje);
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
