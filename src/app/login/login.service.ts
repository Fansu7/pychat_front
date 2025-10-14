import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ChatboxService } from '../home/chatbox/chatbox.service';
import { API_ENDPOINT } from '../constants';

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

    const url = `${API_ENDPOINT}/token`;

    const formData = new URLSearchParams();
    formData.set('username', username);
    formData.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post(url, formData.toString(), { headers }).pipe(
      tap((res: any) => {
        const token = res.access_token;
        localStorage.setItem('access_token', token);

        this.chatboxService.connect(token);
      }),
      catchError((error) => {
        console.error('Error de login:', error);
        return throwError(() => new Error('Credenciales inválidas'));
      })
    );
  }
}
