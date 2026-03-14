import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Building2, Info, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export function CreateAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { signup, isPreviewMode } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsCreating(true);
    try {
      await signup(email, password, name, phone);
      toast.success('Account created successfully!');
      
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
        : 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      console.error('Signup error:', error);
    } finally {
      setIsCreating(false);
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Join Skyway Suites today</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Preview Mode Notice */}
          {isPreviewMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Preview Mode</p>
                <p className="text-xs text-blue-700">
                  You can create an account with any details. Full authentication will work when deployed to Vercel.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
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
              <label className="block text-sm mb-2">Phone Number</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isPreviewMode ? "any password (preview mode)" : "Create a password"}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to={searchParams.get('returnTo') 
                  ? `/login?returnTo=${searchParams.get('returnTo')}` 
                  : '/login'
                } 
                className="text-[#6B7C3C] hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}