import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Amplify } from 'aws-amplify';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { AuthComponent } from './components/auth/auth.component';
import { FormsModule } from '@angular/forms';
import { AuthInterceptor } from './auth.interceptor'; 
import { HomeComponent } from './components/home/home.component';  
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { VideoCallComponent } from './components/video-call/video-call.component';

Amplify.configure({
  Auth:{
    Cognito: {
      userPoolId: 'ap-southeast-2_x1YuRTE27',
      userPoolClientId: '3lmvhlsovthh4sjaqol91930qp',
      loginWith: {
        oauth: {
          domain: "ap-southeast-2x1yurte27.auth.ap-southeast-2.amazoncognito.com",
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: ['http://localhost:4200/'], 
          redirectSignOut: ['http://localhost:4200/'],
          responseType: 'code',
          providers: ['Google', 'Facebook']
        }
      }
    }
  }
})


@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    HomeComponent,
    VideoCallComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AmplifyAuthenticatorModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,  // Đăng ký AuthInterceptor
      multi: true 
  }],
  bootstrap: [AppComponent] 
})
export class AppModule { }
