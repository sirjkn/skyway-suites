import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Building2, Info, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isPreviewMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      
      // Get return URL with booking state
      const returnTo = searchParams.get('returnTo');
      const targetUrl = returnTo ? decodeURIComponent(returnTo) : '/';
      
      // Use setTimeout to avoid race conditions with React Router
      setTimeout(() => {
        navigate(targetUrl, { replace: true });
      }, 0);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8 text-[#6B7C3C]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Login to your Skyway Suites account</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Preview Mode Notice */}
          {isPreviewMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Preview Mode</p>
                <p className="text-xs text-blue-700">
                  You can login with any email/password. Full authentication will work when deployed to Vercel.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isPreviewMode ? "any@email.com (preview mode)" : "your@email.com"}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isPreviewMode ? "any password (preview mode)" : "Enter your password"}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to={searchParams.get('returnTo') 
                  ? `/create-account?returnTo=${searchParams.get('returnTo')}` 
                  : '/create-account'
                } 
                className="text-[#6B7C3C] hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}