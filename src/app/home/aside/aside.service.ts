import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINT } from '../../constants';

@Injectable({
  providedIn: 'root',
})
export class AsideService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    const url = `${API_ENDPOINT}/users/`;
    const headers = new HttpHeaders({ 'content-type': 'application/json' });
    return this.http.get(url, { headers });
  }
}
