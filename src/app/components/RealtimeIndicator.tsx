import { useEffect, useState } from 'react';
import { Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null); // null = checking
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check API connectivity
  useEffect(() => {
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
        
        // Check if it's HTML (preview mode) or JSON (production)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          // In preview/development mode - API not available
          setIsConnected(true);
          setErrorMessage('Development Mode');
          setLastSync(new Date());
          return;
        }
        
        const data = await response.json();
        const connected = data.status === 'ok';
        setIsConnected(connected);
        setErrorMessage(connected ? '' : (data.error || 'Database offline'));
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
          setErrorMessage('Connection failed');
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
  }, []); // Empty dependency array - only run once on mount

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

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