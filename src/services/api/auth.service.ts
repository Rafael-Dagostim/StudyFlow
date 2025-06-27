import api from './axiosConfig';
import { 
  ISignUpRequest, 
  ISignUpResponseData, 
  ISignInRequest, 
  ISignInResponseData,
  IProfileResponseData,
  IUpdateProfileRequest,
  IUpdateProfileResponseData,
  IRefreshTokenRequest,
  IRefreshTokenResponseData,
  ApiResponse 
} from '../../types/types';

export const authService = {
  // Sign up a new user
  signUp: (userData: ISignUpRequest) =>
    api.post('/auth/signup', userData),

  // Sign in an existing user
  signIn: (credentials: ISignInRequest) =>
    api.post('/auth/signin', credentials),

  // Get current user profile
  getProfile: () =>
    api.get('/auth/profile'),

  // Update user profile
  updateProfile: (profileData: IUpdateProfileRequest) =>
    api.put('/auth/profile', profileData),

  // Refresh access token
  refreshToken: (refreshData: IRefreshTokenRequest) =>
    api.post('/auth/refresh', refreshData),

  // Sign out (invalidate tokens)
  signOut: () =>
    api.post('/auth/logout'),

  // Verify token validity (this endpoint might not exist in the API)
  verifyToken: () =>
    api.get('/auth/profile') // Using profile endpoint for verification
};