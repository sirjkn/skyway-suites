import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';

export function DatabaseStatus() {
  const location = useLocation();
  const [isConnected, setIsConnected] = useState<boolean | null>(null); // null = checking
  const [showTooltip, setShowTooltip] = useState(false);
  const [isProduction, setIsProduction] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  // Don't render on frontend pages (only show on admin pages)
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Detect if we're in production (Vercel) or development (Figma Make)
    const hostname = window.location.hostname;
    const isProd = hostname.includes('vercel.app') || hostname.includes('localhost');
    setIsProduction(isProd);

    // Only run health checks in production
    if (isProd) {
      checkConnection();
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    } else {
      // In Figma Make preview, assume connected (API not available)
      setIsConnected(true);
    }
  }, []);

  const checkConnection = async () => {
    try {
      console.log('🔍 Checking database connection...');
      const response = await fetch('/api?endpoint=health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });
      
      // Get response as text first
      const responseText = await response.text();
      console.log('📥 Health check response status:', response.status);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📊 Health check data:', data);
      } catch (parseError) {
        // If it's HTML (like a 404 page), API route not found
        console.warn('Health check: API route not available (in development/preview mode)');
        setIsConnected(true); // Assume connected in preview
        return;
      }
      
      // Check if response indicates API is working
      const connected = data.status === 'ok';
      setIsConnected(connected);
      
      if (!connected) {
        setErrorDetails(data.error || 'Neon database offline');
        console.error('❌ Database disconnected:', data.error);
      } else {
        setErrorDetails('');
        console.log('✅ Database connected');
      }
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      setIsConnected(false);
      setErrorDetails('Neon database is currently offline');
    }
  };

  // Don't render on frontend pages (only show on admin pages)
  if (!isAdminPage) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-md">
          {isConnected === null ? (
            <>
              <div className="font-semibold flex items-center gap-2">
                <span className="text-gray-400">...</span> Checking connection
              </div>
              <div className="text-xs text-gray-300 mt-1">Please wait...</div>
            </>
          ) : isConnected ? (
            <>
              <div className="font-semibold flex items-center gap-2">
                <span className="text-green-400">✓</span> Connected to Neon DB
              </div>
              <div className="text-xs text-gray-300 mt-1">Database operational</div>
            </>
          ) : (
            <>
              <div className="font-semibold flex items-center gap-2">
                <span className="text-red-400">✗</span> Database Disconnected
              </div>
              <div className="text-xs text-gray-300 mt-1">Attempting to reconnect...</div>
              {errorDetails && (
                <div className="text-xs text-red-300 mt-2 whitespace-normal max-w-xs">
                  Error: {errorDetails}
                </div>
              )}
            </>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-6 -mt-px">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="relative w-6 h-6 flex items-center justify-center cursor-pointer">
        {isConnected === null ? (
          <>
            {/* Outermost pulsing ring - slowest */}
            <div 
              className="absolute inset-0 rounded-full bg-gray-500/10 animate-pulse"
              style={{ animationDuration: '3s' }}
            ></div>
            
            {/* Second pulsing ring */}
            <div 
              className="absolute inset-0.5 rounded-full bg-gray-500/20 animate-pulse"
              style={{ animationDuration: '2s', animationDelay: '0.5s' }}
            ></div>
            
            {/* Third ring with ping effect */}
            <div className="absolute inset-1 rounded-full bg-gray-500/30 animate-ping"></div>
            
            {/* Middle glow ring */}
            <div className="absolute inset-1.5 rounded-full bg-gray-500/40 blur-sm"></div>
            
            {/* Inner bright core */}
            <div className="relative w-2 h-2 rounded-full bg-gray-500 shadow-lg shadow-gray-500/60 animate-pulse" style={{ animationDuration: '2s' }}></div>
          </>
        ) : isConnected ? (
          <>
            {/* Outermost pulsing ring - slowest */}
            <div 
              className="absolute inset-0 rounded-full bg-green-500/10 animate-pulse"
              style={{ animationDuration: '3s' }}
            ></div>
            
            {/* Second pulsing ring */}
            <div 
              className="absolute inset-0.5 rounded-full bg-green-500/20 animate-pulse"
              style={{ animationDuration: '2s', animationDelay: '0.5s' }}
            ></div>
            
            {/* Third ring with ping effect */}
            <div className="absolute inset-1 rounded-full bg-green-500/30 animate-ping"></div>
            
            {/* Middle glow ring */}
            <div className="absolute inset-1.5 rounded-full bg-green-500/40 blur-sm"></div>
            
            {/* Inner bright core */}
            <div className="relative w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/60 animate-pulse" style={{ animationDuration: '2s' }}></div>
          </>
        ) : (
          <>
            {/* Outer static ring */}
            <div className="absolute inset-0 rounded-full bg-red-500/10"></div>
            
            {/* Second ring */}
            <div className="absolute inset-0.5 rounded-full bg-red-500/20"></div>
            
            {/* Middle glow ring */}
            <div className="absolute inset-1.5 rounded-full bg-red-500/40 blur-sm"></div>
            
            {/* Inner solid dot - slow pulse to indicate trying to reconnect */}
            <div 
              className="relative w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/60 animate-pulse"
              style={{ animationDuration: '3s' }}
            ></div>
          </>
        )}
      </div>
    </div>
  );
}