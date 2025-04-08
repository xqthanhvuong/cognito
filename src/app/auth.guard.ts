import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { getCurrentUser } from 'aws-amplify/auth';  // Import AWS Amplify Auth

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      // Kiểm tra người dùng đã đăng nhập hay chưa
      const user = await getCurrentUser();
      if(user){
        return true;
      } else {
        // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
        this.router.navigate(['/auth']);
        return false;
      }
    } catch (error) {
      // Nếu có lỗi trong việc lấy thông tin người dùng, chuyển hướng đến trang đăng nhập
      this.router.navigate(['/auth']);
      return false;
    }
  }
}
