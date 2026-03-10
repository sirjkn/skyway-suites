import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to detect if we're in preview mode (same as in api.ts)
function isPreviewMode(): boolean {
  return window.location.hostname.includes('makeproxy') || 
         window.location.hostname.includes('localhost') ||
         window.location.hostname.includes('figma.site');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }

    // Log the current mode for clarity
    if (isPreviewMode()) {
      console.log('🎨 Running in PREVIEW MODE - Mock authentication enabled');
    } else {
      console.log('🚀 Running in PRODUCTION MODE - Real API authentication');
    }
  }, []); // Empty dependency array - only run once on mount

  const login = async (email: string, password: string) => {
    // In preview mode, always use mock authentication
    if (isPreviewMode()) {
      console.log('🔧 Preview mode: Using mock authentication');
      
      // Mock user based on email
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'customer',
      };
      
      const mockToken = 'mock-token-' + Date.now();
      
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('✅ Logged in with mock data:', mockUser.role);
      return;
    }

    // In production mode, try real API
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Logged in with real API');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    // In preview mode, always use mock authentication
    if (isPreviewMode()) {
      console.log('🔧 Preview mode: Using mock authentication');
      
      // Mock user for signup
      const mockUser: User = {
        id: '1',
        email,
        name,
        role: 'customer',
      };
      
      const mockToken = 'mock-token-' + Date.now();
      
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('✅ Signed up with mock data');
      return;
    }

    // In production mode, try real API
    try {
      const response = await fetch(`${API_BASE_URL}/auth?action=signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Signup failed' }));
        throw new Error(errorData.error || 'Signup failed');
      }

      const data = await response.json();
      
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Signed up with real API');
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
    <AuthContext.Provider value={{ user, login, logout, signup, isAdmin }}>
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