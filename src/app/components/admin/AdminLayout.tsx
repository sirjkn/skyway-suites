import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Building2, Home, Calendar, Users, CreditCard, Settings, LogOut, Menu, X, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { OfflineBanner } from '../OfflineBanner';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDatabaseOffline, setIsDatabaseOffline] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Check database connection status
  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        const response = await fetch('/api?endpoint=health', {
          cache: 'no-cache'
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          // API not available - in development mode
          setIsDatabaseOffline(false);
          return;
        }
        
        const data = await response.json();
        setIsDatabaseOffline(data.status !== 'ok');
      } catch (error) {
        setIsDatabaseOffline(true);
      }
    };

    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => {
    if (path === '/admin' || path === '/admin/properties') {
      return location.pathname === '/admin' || location.pathname === '/admin/properties';
    }
    return location.pathname === path;
  };

  const navItems = [
    { path: '/admin/properties', label: 'Properties', icon: Home },
    { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { path: '/admin/customers', label: 'Customers', icon: Users },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { path: '/admin/mpesa-transactions', label: 'M-Pesa Transactions', icon: Smartphone },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
    { path: '/admin/email-templates', label: 'Email Templates', icon: Mail },
    { path: '/admin/email-diagnostics', label: 'Email Diagnostics', icon: Mail },
    { path: '/admin/debug-settings', label: 'Debug Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    // Navigate to home page after logout
    // Use setTimeout to avoid race condition with useEffect redirect
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 0);
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2 mb-4 hover:text-[#C9B99B] transition-colors">
            <Building2 className="h-8 w-8 text-[#C9B99B]" />
            <div>
              <div className="font-semibold">Skyway Suites</div>
              <div className="text-xs text-gray-400">Admin Dashboard</div>
            </div>
          </Link>
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm text-[#C9B99B] hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-[#6B7C3C] text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-semibold">{user?.name || 'Admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-0">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4 md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-700 hover:text-[#6B7C3C] transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-[#C9B99B]" />
              <span className="font-semibold text-gray-900">Skyway Suites Admin</span>
            </div>
          </div>
        </div>
        
        {/* Offline Banner - Show at top when database is offline */}
        {isDatabaseOffline && (
          <div className="sticky top-0 md:top-0 z-20">
            <OfflineBanner />
          </div>
        )}
        
        <Outlet />
      </main>
    </div>
  );
}