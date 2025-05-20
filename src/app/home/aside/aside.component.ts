import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsideService } from './aside.service';
import { ChatboxService } from '../chatbox/chatbox.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-aside',
  imports: [CommonModule],
  templateUrl: './aside.component.html',
  styleUrl: './aside.component.css',
})
export class AsideComponent implements OnInit {
  users: any[] = [];

  constructor(
    private asideService: AsideService,
    private router: Router,
    private chatboxService: ChatboxService
  ) {}

  ngOnInit(): void {
    this.asideService.getUsers().subscribe((data: any) => {
      this.users = data;
      console.log(this.users);
    });
  }

  seleccionarUsuario(user: any) {
    this.chatboxService.selectUser(user);
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
