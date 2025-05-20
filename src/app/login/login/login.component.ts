import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { LoginService } from '../login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  showContent = false;

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: [''],
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.showContent = true;
    }, 0);
  }

  onSubmit() {
    const { username, password } = this.loginForm.value;

    this.loginService.logIn(username, password).subscribe({
      next: () => {
        console.log('Login exitoso');
        this.navigateHome();
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
      },
    });
  }

  navigateHome(): void {
    this.router.navigate(['home']);
  }
}
