import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';  // Import HomeComponent
import { AuthComponent } from './components/auth/auth.component';  // Import AuthComponent
import { AuthGuard } from './auth.guard'; // Import AuthGuard

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' , }, // Trang mặc định là trang đăng nhập
  { path: 'auth', component: AuthComponent }, // Trang đăng nhập
  { path: 'home', component: HomeComponent , canActivate: [AuthGuard]}, // Bảo vệ HomeComponent bằng AuthGuard
  { path: '**', redirectTo: '/auth' } // Nếu không tìm thấy route, chuyển hướng về trang đăng nhập
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
