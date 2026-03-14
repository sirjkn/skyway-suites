import { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle2, Loader2, Wrench } from 'lucide-react';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';

// Detect if we're in preview mode
function isPreviewMode(): boolean {
  const hostname = window.location.hostname;
  return hostname.includes('makeproxy') || 
         hostname.includes('localhost') || 
         hostname === '127.0.0.1';
}

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null); // null = checking
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string>('');
  const inPreview = isPreviewMode();
  const { user } = useAuth();

  // Only show indicator if admin is logged in
  if (!user?.role || user.role !== 'admin') {
    return null;
  }

  // Check API connectivity
  useEffect(() => {
    // In preview mode, show preview status immediately and don't make any API calls
    if (inPreview) {
      setIsConnected(null); // null will show special preview state
      setErrorMessage('Preview Mode - Deploy to Vercel');
      console.info('🟧 Preview Mode Active - No API calls will be made');
      return; // Don't set up interval or make any checks
    }

    let isMounted = true;

    const checkConnection = async () => {
      // Prevent check if component unmounted
      if (!isMounted) return;

      try {
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch('/api?endpoint=health', {
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(requestTimeout);
        
        if (!isMounted) return; // Check again after async operation
        
        const data = await response.json();
        const connected = data.status === 'ok' && data.database === 'connected';
        setIsConnected(connected);
        setErrorMessage(connected ? '' : (data.error || data.message || 'Database offline'));
        setLastSync(new Date());
        
        // Log detailed status for debugging
        if (!connected) {
          console.error('🔴 Neon DB Offline:', {
            status: data.status,
            database: data.database,
            error: data.error,
            message: data.message
          });
        } else {
          console.log('🟢 Neon DB Connected:', {
            dbTimestamp: data.dbTimestamp,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        if (!isMounted) return;
        
        if (error instanceof Error && error.name !== 'AbortError') {
          setIsConnected(false);
          setErrorMessage('API not deployed');
          // Silently handle - no console warnings needed in preview
        }
      }
    };

    // Check immediately on mount
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        checkConnection();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [inPreview]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // In preview mode, show special preview badge
  if (inPreview) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Badge
          variant="default"
          className="flex items-center gap-2 px-4 py-2 shadow-xl border-2"
          style={{
            backgroundColor: '#f59e0b',
            borderColor: '#fbbf24',
            color: 'white'
          }}
        >
          <Wrench className="w-4 h-4" />
          <span className="text-xs font-medium">Preview Mode</span>
        </Badge>
        <div className="text-xs text-gray-600 mt-1 text-right bg-white/90 px-2 py-1 rounded shadow">
          <span className="text-orange-700">Deploy to Vercel for live data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Badge
        variant={isConnected ? 'default' : 'destructive'}
        className="flex items-center gap-2 px-4 py-2 shadow-xl border-2"
        style={{
          backgroundColor: isConnected === null ? '#6B7C3C' : (isConnected ? '#6B7C3C' : '#dc2626'),
          borderColor: isConnected === null ? '#C9B99B' : (isConnected ? '#C9B99B' : '#ef4444'),
          color: 'white'
        }}
      >
        {isConnected === null ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Checking...</span>
          </>
        ) : isConnected ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <Database className="w-4 h-4" />
            <span className="text-xs font-medium">Neon DB Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Database Offline</span>
          </>
        )}
      </Badge>
      <div className="text-xs text-gray-600 mt-1 text-right bg-white/90 px-2 py-1 rounded shadow">
        {isConnected ? (
          <span className="text-green-700">✓ Last sync: {formatTime(lastSync)}</span>
        ) : isConnected === false ? (
          <span className="text-red-700">✗ {errorMessage}</span>
        ) : (
          <span className="text-gray-600">Connecting...</span>
        )}
      </div>
    </div>
  );
}