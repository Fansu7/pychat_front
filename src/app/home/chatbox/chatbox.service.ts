import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { API_ENDPOINT } from '../../constants';

@Injectable({ providedIn: 'root' })
export class ChatboxService {
  private socket: WebSocket | null = null;
  private isOpen = false;
  private reconnectAttempts = 0;
  private pingTimer: any = null;
  private readonly maxBackoff = 15000;
  private readonly pendingQueue: any[] = [];

  private selectedUserSource = new BehaviorSubject<any>(null);
  private mensajeSubject = new Subject<any>();

  selectedUser$ = this.selectedUserSource.asObservable();

  constructor(private http: HttpClient) {}

  private buildWsUrl(token: string): string {
    const api = API_ENDPOINT;
    let base: string;

    if (api.startsWith('http')) {
      const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      base = api.replace(/^https?/, scheme);
    } else {
      const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = api.replace(/^\/+/, '');
      base = `${scheme}://${host}`;
    }

    return `${base}/ws?token=${encodeURIComponent(token)}`;
  }

  connect(token: string): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.warn('[WS] ya hay una conexión activa/pendiente');
      return;
    }

    const websocketUrl = this.buildWsUrl(token);
    this.socket = new WebSocket(websocketUrl);

    this.socket.onopen = () => {
      console.log('[WS] open', websocketUrl);
      this.isOpen = true;
      this.reconnectAttempts = 0;
      this.startPing();
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

    this.socket.onclose = (ev) => {
      console.warn('[WS] closed', ev.code, ev.reason);
      this.cleanup();
      this.scheduleReconnect(token);
    };

    this.socket.onerror = (err) => {
      console.error('[WS] error', err);
    };
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup() {
    this.isOpen = false;
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.socket = null;
  }

  private scheduleReconnect(token: string) {
    this.reconnectAttempts++;
    const backoff = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      this.maxBackoff
    );
    setTimeout(() => this.connect(token), backoff);
  }

  private startPing() {
    this.pingTimer = setInterval(() => {
      if (this.socket && this.isOpen) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
        } catch (e) {
          console.warn('[WS] ping failed', e);
        }
      }
    }, 25000);
  }

  private flushQueue() {
    while (
      this.isOpen &&
      this.pendingQueue.length &&
      this.socket?.readyState === WebSocket.OPEN
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

  getMensajes(userId: number) {
    const url = `${API_ENDPOINT}/messages/${userId}`;
    const token = localStorage.getItem('access_token') || '';
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    return this.http.get(url, { headers });
  }

  enviarMensaje(mensaje: { receiver_id: number; content: string }) {
    const payload = {
      type: 'message',
      receiver_id: mensaje.receiver_id,
      content: mensaje.content,
      ts: Date.now(),
    };

    if (this.socket?.readyState === WebSocket.OPEN && this.isOpen) {
      try {
        this.socket.send(JSON.stringify(payload));
      } catch (e) {
        console.error('[WS] send error, encolo', e);
        this.pendingQueue.push(payload);
      }
    } else {
      this.pendingQueue.push(payload);
    }
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
