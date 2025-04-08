import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { signIn, signUp, fetchUserAttributes, signInWithRedirect, fetchAuthSession, confirmSignUp, getCurrentUser, signOut, type ConfirmSignUpInput, type SignInInput } from 'aws-amplify/auth';
import { Observable } from 'rxjs';
type SignUpParameters = {
  username: string;
  password: string;
  email: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router, private http: HttpClient) {}

  async  handleSignUp({
    username,
    password,
    email
  }: SignUpParameters) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
    } catch (error) {
      throw new Error('error signing up: ' + error);
    }
  }

  async getToken(): Promise<string> {
    try {
      // Lấy thông tin phiên người dùng (session)
      const session = await fetchAuthSession(); // fetchAuthSession() sẽ lấy toàn bộ session

      // Kiểm tra và trả về access token từ session
      if (session && session.tokens?.accessToken) {
        const token = session.tokens.accessToken.toString(); // Truy cập vào access token
        return token;
      }

      throw new Error('Access token not available');
    } catch (error) {
      console.error('Error getting token', error);
      throw new Error('User not authenticated or session invalid');
    }
  }
  async  handleSignUpConfirmation({
    username,
    confirmationCode
  }: ConfirmSignUpInput) {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode
      });
    } catch (error) {
      throw new Error('error confirming sign up: ' + error);
    }
  }


  async handleSignIn({ username, password }: SignInInput) {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
    } catch (error) {
      throw new Error('error signing in: ' + error);
    }
  }

  async  handleSignOut() {
    try {
      await signOut();
      console.log('User signed out successfully');
    } catch (error) {
      console.log('error signing out: ', error);
    }
  }

  // Đăng nhập với Google
  async googleSignIn() {
    try {
      await signInWithRedirect({ provider: "Google" }); 
      console.log('Google sign-in initiated');
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw new Error('error signing in with Google: ' + error);
    }
  }



    async faceSignIn() {
      try {
        await signInWithRedirect({ provider: "Facebook" }); 
        console.log('facebook sign-in initiated');
      } catch (error) {
        console.error('facebook sign-in error:', error);
        throw new Error('error signing in with facebook: ' + error);
      }
    }

  // Xử lý sau khi người dùng được chuyển hướng trở lại sau khi đăng nhập Google
  // async handleRedirectSignIn() {
  //   try {
  //     const user = await getCurrentUser();
  //     console.log('User signed in through Google:', user);
  //   } catch (error) {
  //     console.error('Error during redirect sign-in:', error);
  //     throw new Error('error during redirect sign-in: ' + error);
  //   }
  // }

  async getUser(){
    try {
      const user = await fetchUserAttributes();
      return user;
    } catch (error) {
      
      console.error('Error getting user:', error);
      return null;
    }
  }
  async getCurrentUser() {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getUserInfoViaOAuth(): Promise<any> {
    try {
      const session = await fetchAuthSession();
  
      if (!session.tokens?.accessToken) {
        throw new Error('Access token not found');
      }
  
      const accessToken = session.tokens.accessToken.toString();
  
      const response = await fetch('https://ap-southeast-2x1yurte27.auth.ap-southeast-2.amazoncognito.com/oauth2/userInfo', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
  
      const userInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info via OAuth:', error);
      return null;
    }
  }

  public getUserInfoExternalProvider(): Observable<any>{
    return this.http.get('https://ap-southeast-2x1yurte27.auth.ap-southeast-2.amazoncognito.com/oauth2/userInfo')
  }

  
  

}
