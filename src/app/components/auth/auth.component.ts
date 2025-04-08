import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';  // Import AuthService mà bạn đã tạo ở trên

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  notificationMessage: string = ''; // Lưu thông báo
  showNotification: boolean = false;
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  email: string = '';
  confirmationCode: string = '';  // Mã xác nhận
  isSignUpConfirmationVisible: boolean = false;  // Biến để điều khiển việc hiển thị ô nhập mã xác nhận
  @ViewChild('containerDiv') containerDiv!: ElementRef;

  constructor(private authService: AuthService, private router: Router, private renderer: Renderer2) {}

  ngOnInit() {
    
    setTimeout(() => {
      this.renderer.addClass(this.containerDiv.nativeElement, 'sign-in');
    }, 200);
  }

  showNotificationMessage(message: string) {
    this.notificationMessage = message;
    this.showNotification = true;
    setTimeout(() => {
      this.showNotification = false;
    }, 3000); // 3 giây
  }

  // Đăng ký người dùng mới
  async handleSignUp() {
    const user = {
      username: this.username,
      password: this.password,
      email: this.email
    };
    await this.authService.handleSignUp(user);
    // Sau khi đăng ký thành công, hiển thị ô nhập mã xác nhận
    this.showNotificationMessage('Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.');
    this.isSignUpConfirmationVisible = true;
  }

  toggle() {
    if(this.containerDiv.nativeElement.classList.contains('sign-in')) {
      this.renderer.removeClass(this.containerDiv.nativeElement, 'sign-in');
      this.renderer.addClass(this.containerDiv.nativeElement, 'sign-up');
    } else {
      this.renderer.addClass(this.containerDiv.nativeElement, 'sign-in');
      this.renderer.removeClass(this.containerDiv.nativeElement, 'sign-up');
    }
  }

  // Xác nhận đăng ký (sử dụng mã xác nhận)
  async handleSignUpConfirmation() {
    const confirmationCode = this.confirmationCode;
    console.log(confirmationCode);
    if (confirmationCode) {
      try{
        await this.authService.handleSignUpConfirmation({ username: this.username, confirmationCode });
        this.toggle();
    this.showNotificationMessage('Xác nhận tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.');
      }catch (error) {
        console.log('error confirming sign up', error);
      }
    }
  }

  // Đăng nhập người dùng
  async handleSignIn() {
    const user = {
      username: this.username,
      password: this.password
    };
    try{
      await this.authService.handleSignIn(user);
      this.showNotificationMessage('Đăng nhập thành công.');
      this.router.navigate(['/home']);
    }catch (error) {
      console.error('Error signing in:', error);
      this.showNotificationMessage('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    }
  }

  // Đăng xuất người dùng
  async handleSignOut() {
    await this.authService.handleSignOut();
  }

  // Đăng nhập qua Google
  async googleSignIn() {
    try{
      await this.authService.googleSignIn();
      this.showNotificationMessage('Đăng nhập qua Google thành công.');
      this.router.navigate(['/home']);
    }catch (error) {
      console.error('Google sign-in error:', error);
      this.showNotificationMessage('Đăng nhập qua Google thất bại. Vui lòng thử lại.');
    }
  }

  async faceSignIn() {
    try{
      await this.authService.faceSignIn();
      this.showNotificationMessage('Đăng nhập qua Facebook thành công.');
      this.router.navigate(['/home']);
    }catch (error) {
      console.error('Face sign-in error:', error);
      this.showNotificationMessage('Đăng nhập qua Facebook thất bại. Vui lòng thử lại.');
    }
  }

  // Xử lý đăng nhập sau khi chuyển hướng từ Google
  // async handleRedirectSignIn() {
  //   try {
  //     await this.authService.handleRedirectSignIn();
  //     this.showNotificationMessage('Đăng nhập thành công.');
  //     this.router.navigate(['/home']);
  //   } catch (error) {
  //     console.error('Error during redirect sign-in:', error);
  //     this.showNotificationMessage('Đăng nhập thất bại. Vui lòng thử lại.');
  //   }
  // }

  async checkUser() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      console.log("User is signed in:", user);
      // Chuyển hướng đến trang chính của ứng dụng
      this.router.navigate(['/home']);
    } else {
      console.log("No user is signed in.");
    }
  }
}
