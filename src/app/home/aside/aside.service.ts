import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AsideService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    const url = 'http://localhost:8000/users/';
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.get(url, { headers });
  }
}
