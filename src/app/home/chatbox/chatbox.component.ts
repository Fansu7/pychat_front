import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatboxService } from './chatbox.service';
import { jwtDecode } from 'jwt-decode';
import { tokenResponse } from '../../interfaces/token';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbox',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css'],
})
export class ChatboxComponent implements OnInit, OnDestroy {
  currentUserId!: number;
  nuevoMensaje = '';
  mensajes: any[] = [];
  selectedUser: any = null;

  private subs = new Subscription();

  constructor(private chatboxService: ChatboxService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<tokenResponse>(token);
        if (decoded?.userId) {
          this.currentUserId = decoded.userId;
          this.chatboxService.connect(token);
        }
      } catch (e) {
        console.error('Token inválido:', e);
      }
    } else {
      console.error('No hay access_token en localStorage');
    }

    this.subs.add(
      this.chatboxService.selectedUser$.subscribe((user) => {
        this.selectedUser = user ?? null;
        this.mensajes = [];
        if (user?.id) this.cargarMensajes(user.id);
      })
    );

    // stream de WS
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
          if (sid === sel || rid === sel) this.mensajes.push(message);
        } else {
          if (sid === this.currentUserId || rid === this.currentUserId)
            this.mensajes.push(message);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.chatboxService.disconnect();
  }

  cargarMensajes(userId: number): void {
    if (typeof userId !== 'number') return;
    this.chatboxService.getMensajes(userId).subscribe({
      next: (response) => {
        this.mensajes = Array.isArray(response) ? response : [];
      },
      error: (error) => {
        console.error('Error fetching messages:', error);
      },
    });
  }

  enviarMensaje() {
    const content = this.nuevoMensaje?.trim();
    if (!content || !this.selectedUser) return;

    this.chatboxService.enviarMensaje({
      receiver_id: this.selectedUser.id,
      content,
    });
    this.nuevoMensaje = '';
  }
}
