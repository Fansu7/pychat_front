import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { jwtDecode } from 'jwt-decode';
import { ChatboxService } from '../home/chatbox/chatbox.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(
    private http: HttpClient,
    private chatboxService: ChatboxService
  ) {}

  logIn(username: string, password: string): Observable<any> {
    interface tokenResponse {
      sub: string;
      userId: number;
      exp: number;
    }

    const url = 'http://localhost:8000/token';
    const formData = new URLSearchParams();
    formData.set('username', username);
    formData.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post(url, formData.toString(), { headers }).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token', res.access_token);
        const userId = jwtDecode<tokenResponse>(res.access_token).userId;
        this.chatboxService.connect(userId);
      }),
      catchError((error) => {
        console.error('Error de login:', error);
        return throwError(() => new Error('Credenciales inválidas'));
      })
    );
  }
}
