import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatboxService } from './chatbox.service';

type UserLite = { id: number; username: string };

// Respuesta del API
type MsgApi = {
  sender_id: number;
  receiver_id: number;
  content: string;
  [k: string]: any;
};

// Mensajes que llegan por WebSocket
type MsgWs = {
  sender_nickname: string;
  receiver_id: number;
  content: string;
  [k: string]: any;
};

function isMsgApi(m: any): m is MsgApi {
  return m && typeof m.sender_id === 'number';
}
function isMsgWs(m: any): m is MsgWs {
  return m && typeof m.sender_nickname === 'string';
}

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbox.component.html',
  styleUrl: './chatbox.component.css',
})
export class ChatboxComponent {
  currentUser: UserLite | null = null;
  selectedUser: UserLite | null = null;

  nuevoMensaje = '';
  mensajes: Array<MsgApi | MsgWs> = [];

  constructor(private chatboxService: ChatboxService) {}

  ngOnInit(): void {
    // Carga usuario guardado tras login
    const raw = localStorage.getItem('user');
    if (raw) {
      this.currentUser = JSON.parse(raw) as UserLite;
      this.chatboxService.connect(this.currentUser.id); // abre WS
    }

    // Cambio de usuario seleccionado
    this.chatboxService.selectedUser$.subscribe((user) => {
      this.selectedUser = user;
      this.mensajes = [];
      if (user) this.cargarMensajes(user.id);
    });

    // Mensajes en tiempo real (WS)
    this.chatboxService.getMensajesStream().subscribe((msg: any) => {
      if (!this.currentUser || !this.selectedUser) return;

      // Filtra solo la conversación activa
      if (isMsgApi(msg)) {
        const m = msg;
        const relevante =
          (m.sender_id === this.selectedUser.id &&
            m.receiver_id === this.currentUser.id) ||
          (m.sender_id === this.currentUser.id &&
            m.receiver_id === this.selectedUser.id);
        if (relevante) this.mensajes.push(m);
      } else if (isMsgWs(msg)) {
        const m = msg;
        const relevante =
          (m.receiver_id === this.currentUser.id &&
            m.sender_nickname === this.selectedUser.username) ||
          (m.receiver_id === this.selectedUser.id &&
            m.sender_nickname === this.currentUser.username);
        if (relevante) this.mensajes.push(m);
      }
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
    if (!this.currentUser || !this.selectedUser) return;
    const text = this.nuevoMensaje.trim();
    if (!text) return;

    const payload = { receiver_id: this.selectedUser.id, content: text };

    // Envia por WS (dentro del service) y persiste por HTTP
    this.chatboxService.enviarMensaje(payload).subscribe({
      next: () => {
        this.nuevoMensaje = '';
      },
      error: (err) => console.error('Error enviando mensaje:', err),
    });
  }
}
