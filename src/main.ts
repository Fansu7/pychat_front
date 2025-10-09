import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/guards/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    ...(appConfig.providers ?? []),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch(console.error);
