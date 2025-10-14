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

  connect(userId: number): void {
    const websocketUrl = `wss://${API_ENDPOINT}/ws/${userId}`;
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

  getMensajes(user: any) {
    const url = `${API_ENDPOINT}/messages/${user}`;
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.get(url, { headers });
  }

  enviarMensaje(mensaje: any) {
    const url = `${API_ENDPOINT}/messages/`;
    const headers = new HttpHeaders({ 'content-type': 'application/json' });

    if (this.socket?.readyState === WebSocket.OPEN) {
      const payload = {
        receiver_id: mensaje.receiver_id,
        content: mensaje.content,
      };
      this.socket.send(JSON.stringify(payload));
      console.log('Mensaje enviado a través de WebSocket:', payload);
    } else {
      console.error('WebSocket not connected');
    }

    return this.http.post(url, mensaje, { headers });
  }

  getMensajesStream() {
    return this.mensajeSubject.asObservable();
  }
}
