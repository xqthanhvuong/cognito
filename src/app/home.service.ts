import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  private apiUrl = 'http://localhost:8000/users/register'; // URL của backend

  constructor(private http: HttpClient) {}

  // // Lấy dữ liệu từ backend
  // getHomeData(): Observable<any> {
  //   return this.http.get<any>(this.apiUrl);  // Gửi yêu cầu GET
  // }

  // Đăng ký người dùng mới bằng token
  registerUser(): Observable<any> {
    return this.http.post<any>(this.apiUrl, {}); // Không cần thêm header thủ công nữa
  }

}
