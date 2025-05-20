import { Component } from '@angular/core';
import { AsideComponent } from '../aside/aside.component';
import { ChatboxComponent } from '../chatbox/chatbox.component';

@Component({
  selector: 'app-home',
  imports: [AsideComponent, ChatboxComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
