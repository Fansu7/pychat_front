import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatboxService } from './chatbox.service';
import { jwtDecode } from 'jwt-decode';
import { tokenResponse } from '../../interfaces/token';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbox',
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbox.component.html',
  styleUrl: './chatbox.component.css',
})
export class ChatboxComponent implements OnDestroy {
  currentUserId!: number;
  nuevoMensaje: string = '';
  mensajes: any[] = [];
  selectedUser: any = null;

  private subs = new Subscription();

  constructor(private chatboxService: ChatboxService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      let decoded: tokenResponse | null = null;
      try {
        decoded = jwtDecode<tokenResponse>(token);
      } catch (e) {
        console.error('Token inválido:', e);
      }
      if (decoded?.userId) {
        this.currentUserId = decoded.userId;
        console.log('[WS] token prefix =>', token.slice(0, 16));
        this.chatboxService.connect(token);
      }
    } else {
      console.error('No hay access_token en localStorage');
    }

    // selectedUser$
    this.subs.add(
      this.chatboxService.selectedUser$.subscribe((user) => {
        if (!user) {
          this.selectedUser = null;
          this.mensajes = [];
          return;
        }
        this.selectedUser = user;
        this.mensajes = [];
        this.cargarMensajes(user.id);
      })
    );

    // stream WS
    this.subs.add(
      this.chatboxService.getMensajesStream().subscribe((message) => {
        if (!message) return;

        const sid = Number((message as any).sender_id);
        const rid = Number((message as any).receiver_id);
        const sel = Number(this.selectedUser?.id);

        if (Number.isNaN(sid) || Number.isNaN(rid)) {
          console.warn('[WS] mensaje sin ids válidos:', message);
          return;
        }

        if (this.selectedUser) {
          if (sid === sel || rid === sel) {
            this.mensajes.push(message);
          }
        } else {
          if (sid === this.currentUserId || rid === this.currentUserId) {
            this.mensajes.push(message);
          }
        }

        console.log('Incoming realtime message:', message);
      })
    );
  }

  ngOnDestroy(): void {
    // <-- NUEVO
    this.subs.unsubscribe();
  }

  cargarMensajes(userId: number): void {
    if (typeof userId !== 'number') return;
    this.chatboxService.getMensajes(userId).subscribe({
      next: (response) => {
        this.mensajes = Array.isArray(response) ? response : [];
        console.log('Fetched messages:', this.mensajes);
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      },
    });
  }

  enviarMensaje() {
    const content = this.nuevoMensaje?.trim();
    if (!content) return;
    if (!this.selectedUser) return;

    const mensaje = {
      receiver_id: this.selectedUser.id,
      content,
    };

    this.chatboxService.enviarMensaje(mensaje);
    this.nuevoMensaje = '';
  }
}
