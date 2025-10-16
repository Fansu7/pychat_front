import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { API_ENDPOINT } from '../../constants';

@Injectable({ providedIn: 'root' })
export class ChatboxService {
  private socket: WebSocket | null = null;
  private readonly pendingQueue: any[] = [];

  private selectedUserSource = new BehaviorSubject<any>(null);
  private mensajeSubject = new Subject<any>();

  selectedUser$ = this.selectedUserSource.asObservable();

  private readonly API_BASE = API_ENDPOINT;
  private readonly WS_BASE = this.API_BASE.replace(/^http/, 'ws');

  constructor(private http: HttpClient) {}

  private buildWsUrl(token: string): string {
    return `${this.WS_BASE}/ws?token=${encodeURIComponent(token)}`;
  }

  connect(token: string): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const url = this.buildWsUrl(token);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.flushQueue();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.mensajeSubject.next(data);
      } catch (e) {
        console.error('[WS] JSON inválido:', e, event.data);
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };

    this.socket.onerror = (err) => {
      console.error('[WS] error', err);
    };
  }

  disconnect(): void {
    try {
      this.socket?.close();
    } catch {}
    this.socket = null;
    this.pendingQueue.length = 0;
  }

  private flushQueue() {
    while (
      this.socket?.readyState === WebSocket.OPEN &&
      this.pendingQueue.length
    ) {
      const payload = this.pendingQueue.shift();
      try {
        this.socket.send(JSON.stringify(payload));
      } catch (e) {
        console.error('[WS] send (flush) error', e);
        this.pendingQueue.unshift(payload);
        break;
      }
    }
  }

  selectUser(user: any) {
    this.selectedUserSource.next(user);
  }

  getMensajes(otherUserId: number) {
    return this.http.get(`${this.API_BASE}/messages/${otherUserId}`);
  }

  enviarMensaje(mensaje: { receiver_id: number; content: string }) {
    const payload = {
      receiver_id: mensaje.receiver_id,
      content: mensaje.content,
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      const handler = () => {
        try {
          this.socket?.send(JSON.stringify(payload));
        } finally {
          this.socket?.removeEventListener('open', handler);
        }
      };
      this.socket.addEventListener('open', handler, { once: true });
      this.pendingQueue.push(payload);
    } else {
      this.pendingQueue.push(payload);
      console.warn('[WS] no conectado; el mensaje se envía solo por HTTP');
    }

    return this.http.post(`${this.API_BASE}/messages/`, payload);
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
