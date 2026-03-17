import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => void;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  isAdmin: boolean;
  isPreviewMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to detect if we're in Figma Make preview
const isInPreviewMode = () => {
  const hostname = window.location.hostname;
  // Only enable preview mode in Figma Make (NOT on production domains)
  // Preview mode is disabled for localhost, vercel.app, and custom domains
  return !hostname.includes('localhost') && 
         !hostname.includes('vercel.app') && 
         !hostname.includes('.co.ke') &&
         !hostname.includes('.com') &&
         !hostname.includes('.net') &&
         !hostname.includes('.org');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasRealUsers, setHasRealUsers] = useState(false);
  const baseIsPreviewMode = isInPreviewMode();
  
  // Only show preview mode if no real users exist
  const isPreviewMode = baseIsPreviewMode && !hasRealUsers;

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If on production and using a preview token, clear it
      if (!baseIsPreviewMode && token.startsWith('preview-token-')) {
        console.log('Preview token detected on production domain. Clearing...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        return;
      }
      
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          // If there's a real user (non-preview token), mark as having real users
          if (!token.startsWith('preview-token-')) {
            setHasRealUsers(true);
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  }, [baseIsPreviewMode]);

  const login = async (email: string, password: string) => {
    try {
      // In preview mode, use mock authentication
      if (isPreviewMode) {
        // Preview mode - no API available, use mock auth silently
        
        // Mock user data
        const mockUser: User = {
          id: 'preview-user-' + Date.now(),
          email: email,
          name: email.split('@')[0],
          role: email.includes('admin') ? 'admin' : 'customer',
        };
        
        const mockToken = 'preview-token-' + btoa(email);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUser(mockUser);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { user: mockUser, token: mockToken };
      }

      // Real API call for production
      const response = await fetch(`${API_BASE_URL}?endpoint=auth&action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Get response text first to see what we're getting
      const responseText = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
        throw new Error('Server is not responding correctly. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Mark that we have real users since we successfully authenticated
      setHasRealUsers(true);
      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, phone: string) => {
    try {
      // In preview mode, use mock authentication
      if (isPreviewMode) {
        // Preview mode - no API available, use mock auth silently
        
        // Mock user data
        const mockUser: User = {
          id: 'preview-user-' + Date.now(),
          email: email,
          name: name,
          role: 'customer',
        };
        
        const mockToken = 'preview-token-' + btoa(email);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUser(mockUser);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return;
      }

      // Real API call for production
      const response = await fetch(`${API_BASE_URL}?endpoint=auth&action=signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
      });

      // Get response text first to see what we're getting
      const responseText = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
        throw new Error('Server is not responding correctly. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }
      
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, isAdmin, isPreviewMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}