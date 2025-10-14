import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { API_ENDPOINT } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class ChatboxService {
  private socket: WebSocket | null = null;
  private selectedUserSource = new BehaviorSubject<any>(null);
  private mensajeSubject = new Subject<any>();

  selectedUser$ = this.selectedUserSource.asObservable();

  connect(token: string): void {
    const wsBase = API_ENDPOINT.startsWith('http')
      ? API_ENDPOINT.replace(/^http/, 'ws')
      : `wss://${API_ENDPOINT}`;

    const websocketUrl = `${wsBase}/ws?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(websocketUrl);
    console.log('Conectado al websocket:', this.socket);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Mensaje recibido:', data);
      this.mensajeSubject.next(data);
    };

    this.socket.onclose = () => {
      console.log('Conexión cerrada.');
    };
  }

  selectUser(user: any) {
    this.selectedUserSource.next(user);
  }

  constructor(private http: HttpClient) {}

  getMensajes(userId: number) {
    const url = `${API_ENDPOINT}/messages/${userId}`;
    const token = localStorage.getItem('access_token') || '';
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    return this.http.get(url, { headers });
  }

  enviarMensaje(mensaje: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        receiver_id: mensaje.receiver_id,
        content: mensaje.content,
      };
      this.socket.send(JSON.stringify(payload));
      console.log('Mensaje enviado a través de WebSocket:', payload);
    } else {
      console.error('WebSocket not connected');
    }

    return;
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
