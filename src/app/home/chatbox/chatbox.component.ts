import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatboxService } from './chatbox.service';
import { jwtDecode } from 'jwt-decode';
import { tokenResponse } from '../../interfaces/token';

@Component({
  selector: 'app-chatbox',
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbox.component.html',
  styleUrl: './chatbox.component.css',
})
export class ChatboxComponent {
  currentUserId!: number;
  nuevoMensaje: any;
  mensajes: any = [];
  selectedUser: any;

  constructor(private chatboxService: ChatboxService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = jwtDecode<tokenResponse>(token);
      this.currentUserId = decoded.userId;
      console.log('[WS] token prefix =>', token?.slice(0, 16));
      this.chatboxService.connect(token);
    } else {
      console.error('No hay access_token en localStorage');
    }

    this.chatboxService.selectedUser$.subscribe((user) => {
      if (!user) {
        this.selectedUser = null;
        this.mensajes = [];
        return;
      }
      this.selectedUser = user;
      this.mensajes = [];
      this.cargarMensajes(user.id);
    });

    this.chatboxService.getMensajesStream().subscribe((message) => {
      if (!this.selectedUser) return;

      const sid = Number(message.sender_id);
      const rid = Number(message.receiver_id);
      const sel = Number(this.selectedUser.id);

      if (sid === sel || rid === sel) {
        this.mensajes.push(message);
      }

      console.log('Incoming realtime message:', message);
    });
  }

  cargarMensajes(userId: number): void {
    this.chatboxService.getMensajes(userId).subscribe(
      (response) => {
        this.mensajes = response;
        console.log('Fetched messages:', this.mensajes);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  enviarMensaje() {
    if (!this.nuevoMensaje || this.nuevoMensaje.trim() === '') {
      return;
    }
    if (!this.selectedUser) return;

    const mensaje = {
      sender_id: jwtDecode<tokenResponse>(localStorage.getItem('access_token')!)
        .userId,
      receiver_id: this.selectedUser.id,
      content: this.nuevoMensaje.trim(),
    };

    this.chatboxService.enviarMensaje(mensaje);
    this.nuevoMensaje = '';
  }
}
