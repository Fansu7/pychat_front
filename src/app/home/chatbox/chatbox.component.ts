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

    this.subs.add(
      this.chatboxService.getMensajesStream().subscribe((msg) => {
        if (!msg) return;

        const sel = Number(this.selectedUser?.id);

        // Si hay usuario seleccionado: muestra los que sean entre currentUserId y ese usuario
        if (this.selectedUser) {
          if (
            (msg.sender_id === this.currentUserId && msg.receiver_id === sel) ||
            (msg.sender_id === sel && msg.receiver_id === this.currentUserId)
          ) {
            this.mensajes = [...this.mensajes, msg];
          }
          return;
        }

        // Si no hay seleccionado: muestra todo lo que involucre a currentUserId
        if (
          msg.sender_id === this.currentUserId ||
          msg.receiver_id === this.currentUserId
        ) {
          this.mensajes = [...this.mensajes, msg];
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

    const ok = this.chatboxService.enviarMensaje({
      receiver_id: Number(this.selectedUser.id),
      content,
    });

    if (ok) this.nuevoMensaje = '';
  }
}
