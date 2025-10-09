// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { API_ENDPOINT } from '../../constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token'); // misma key que guardas en login
  const isApi = req.url.startsWith(API_ENDPOINT); // 'https://chat-back-bs8c.onrender.com'
  const isLogin = req.url === `${API_ENDPOINT}/token`;

  return next(
    token && isApi && !isLogin
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req
  );
};
