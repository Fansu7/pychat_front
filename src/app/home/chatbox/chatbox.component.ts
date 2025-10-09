import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatboxService } from './chatbox.service';
import { jwtDecode } from 'jwt-decode';

type UserLite = { id: number; username: string };
type MsgApi = {
  sender_id: number;
  receiver_id: number;
  content: string;
  [k: string]: any;
};
type MsgWs = {
  sender_nickname: string;
  receiver_id: number;
  content: string;
  [k: string]: any;
};
type TokenPayload = { userId: number; sub?: string; exp?: number };

function isMsgApi(m: any): m is MsgApi {
  return !!m && typeof m.sender_id === 'number';
}
function isMsgWs(m: any): m is MsgWs {
  return !!m && typeof m.sender_nickname === 'string';
}

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css'],
})
export class ChatboxComponent {
  currentUserId: number | null = null;
  selectedUser: UserLite | null = null;

  nuevoMensaje = '';
  mensajes: Array<MsgApi | MsgWs> = [];

  constructor(private chatboxService: ChatboxService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded?.userId != null) {
          this.currentUserId = decoded.userId;
          this.chatboxService.connect(this.currentUserId);
        }
      } catch (e) {
        console.error('JWT decode failed', e);
      }
    }

    this.chatboxService.selectedUser$.subscribe((user) => {
      this.selectedUser = user;
      this.mensajes = [];
      if (user?.id && this.currentUserId != null) {
        this.cargarMensajes(user.id);
      }
    });

    this.chatboxService.getMensajesStream().subscribe((msg: MsgApi | MsgWs) => {
      if (!this.selectedUser || this.currentUserId == null) return;

      let relevante = false;

      if (isMsgApi(msg)) {
        relevante =
          (msg.sender_id === this.selectedUser.id &&
            msg.receiver_id === this.currentUserId) ||
          (msg.sender_id === this.currentUserId &&
            msg.receiver_id === this.selectedUser.id);
      } else if (isMsgWs(msg)) {
        relevante =
          (msg.receiver_id === this.currentUserId &&
            msg.sender_nickname === this.selectedUser.username) ||
          msg.receiver_id === this.selectedUser.id;
      }

      if (relevante) this.mensajes.push(msg);
    });
  }

  private cargarMensajes(otherUserId: number): void {
    this.chatboxService.getMensajes(otherUserId).subscribe({
      next: (response: any) => {
        this.mensajes = Array.isArray(response) ? response : [];
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      },
    });
  }

  enviarMensaje(): void {
    if (this.currentUserId == null || !this.selectedUser) return;
    const text = this.nuevoMensaje.trim();
    if (!text) return;

    const payload = { receiver_id: this.selectedUser.id, content: text };

    this.chatboxService.enviarMensaje(payload).subscribe({
      next: () => {
        this.nuevoMensaje = '';
      },
      error: (err) => {
        console.error('Error enviando mensaje:', err);
      },
    });
  }
}
