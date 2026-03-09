import { AlertCircle } from 'lucide-react';

export function DevModeBanner() {
  // Check if we're using mock data (not deployed to Vercel yet)
  const isLocalDev = !window.location.hostname.includes('vercel.app');
  
  if (!isLocalDev) return null;
  
  return (
    <div className="bg-[#6B7C3C] text-white py-2 px-4 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>
          <strong>Development Mode:</strong> Using mock data. Any email works as login (use "admin@" for admin access). Deploy to Vercel for real database.
        </span>
      </div>
    </div>
  );
}