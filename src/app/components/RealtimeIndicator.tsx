import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';
import { Badge } from './ui/badge';

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Check API connectivity
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkConnection = async () => {
      // Prevent check if component unmounted
      if (!isMounted) return;

      try {
        const controller = new AbortController();
        const requestTimeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch('/api/health', {
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(requestTimeout);
        
        if (!isMounted) return; // Check again after async operation
        
        const data = await response.json();
        setIsConnected(data.status === 'ok');
        setLastSync(new Date());
      } catch (error) {
        if (!isMounted) return;
        
        // In preview mode (Figma Make), API won't exist - that's ok
        // Only set disconnected if we're in production
        if (error instanceof Error && error.name !== 'AbortError') {
          // Check if we're in preview mode by checking the URL
          const isPreview = window.location.hostname.includes('makeproxy') || 
                           window.location.hostname.includes('localhost');
          
          if (!isPreview) {
            setIsConnected(false);
          }
          // In preview mode, keep showing as connected (using mock data)
        }
      }
    };

    // Check immediately on mount
    checkConnection();

    // Check every 60 seconds (reduced from 30 to avoid excessive requests)
    const interval = setInterval(() => {
      if (isMounted) {
        checkConnection();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
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
    <div className="fixed bottom-4 right-4 z-50">
      <Badge
        variant={isConnected ? 'default' : 'destructive'}
        className="flex items-center gap-2 px-3 py-2 shadow-lg"
        style={{
          backgroundColor: isConnected ? '#6B7C3C' : '#dc2626',
          color: 'white'
        }}
      >
        {isConnected ? (
          <>
            <Database className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-medium">Realtime • Neon DB</span>
            <Wifi className="w-3 h-3" />
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium">Offline</span>
          </>
        )}
      </Badge>
      {isConnected && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          Last sync: {formatTime(lastSync)}
        </p>
      )}
    </div>
  );
}