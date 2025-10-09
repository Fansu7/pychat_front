import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_ENDPOINT } from '../constants';
import { jwtDecode } from 'jwt-decode';

type LoginRes = { access_token: string; token_type: string };
type UserLite = { id: number; username: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'access_token';
  private userKey = 'user';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    const body = new URLSearchParams({ username, password }).toString();
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<LoginRes>(`${API_ENDPOINT}/token`, body, { headers })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.tokenKey, res.access_token);

          try {
            const payload: any = jwtDecode(res.access_token);
            const user: UserLite = {
              id: payload.userId,
              username: payload.sub,
            };
            localStorage.setItem(this.userKey, JSON.stringify(user));
          } catch {
            /* noop */
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): UserLite | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? (JSON.parse(raw) as UserLite) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload: any = jwtDecode(token);
      if (typeof payload.exp === 'number') {
        const now = Math.floor(Date.now() / 1000);
        return payload.exp > now;
      }
    } catch {
      /* noop */
    }
    return true;
  }
}
