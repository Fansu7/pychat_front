import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
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

  constructor(private http: HttpClient, private zone: NgZone) {}

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
      console.log('[WS] open', url);
      this.flushQueue();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.zone.run(() => this.mensajeSubject.next(data));
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

  enviarMensaje(mensaje: { receiver_id: number; content: string }): boolean {
    const payload = {
      receiver_id: Number(mensaje.receiver_id),
      content: mensaje.content.trim(),
    };

    console.log(
      '[WS] send try | readyState=',
      this.socket?.readyState,
      payload
    );

    if (!payload.content) return false;

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    } else if (this.socket?.readyState === WebSocket.CONNECTING) {
      const handler = () => {
        try {
          this.socket?.send(JSON.stringify(payload));
          console.log('[WS] sent after open');
        } finally {
          this.socket?.removeEventListener('open', handler);
        }
      };
      this.socket.addEventListener('open', handler, { once: true });
      this.pendingQueue.push(payload);
      return true;
    } else {
      console.warn('[WS] no conectado; no se encola (sin reconexión)');
      return false;
    }
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
