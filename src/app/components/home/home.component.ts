import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { HomeService } from '../../home.service';  // Import HomeService để gọi registerUser
import { Router } from '@angular/router';


interface User {
  sub: string;
  email_verified: boolean;
  email: string;
  username: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  user: User = {
    sub: '',
    email_verified: false,
    email: '',
    username: ''
  }; // variable use to save user info
  
  constructor(private authService: AuthService, private homeService: HomeService, private router: Router) {}

  ngOnInit(): void {
    this.registerUserAfterLogin(); 
    

    this.authService.getCurrentUser().then((user) => {
      if(user) {
        this.user.username = user.username;
        console.log('User info:', user.username);
        if(user.username.startsWith('google_')) {
          this.authService.getUserInfoExternalProvider().subscribe({
          next: (user) => {
            this.user = user;
          }
        })
        }
        else{
          this.authService.getUser().then((user) => {
            if(user?.email){
              this.user.email = user.email; 
            }
            if(user?.email_verified){
              this.user.email_verified = user.email_verified === 'true' ? true : false; 
            }
            if(user?.sub){
              this.user.sub = user.sub; 
            }
          })
        }
      }
    })


    // console.log(this.authService.getUser());
  }

  // Register user after login
  async registerUserAfterLogin() {
    try {
      // get token từ AuthService
      const token = await this.authService.getToken(); 

      this.homeService.registerUser().subscribe(
        response => {
          console.log('User registered successfully:', response);
        },
        error => {
          console.error('Error registering user:', error);
        }
      );
    } catch (error) {
      console.error('Error getting token or registering user:', error);
    }
  }

  // Log out user
  async handleSignOut() {
    try{
      await this.authService.handleSignOut();
      console.log('User signed out successfully');
      this.router.navigate(['/auth']); // navigate to the auth page after sign out
    }catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
