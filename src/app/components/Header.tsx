import { Link, useLocation, useNavigate } from 'react-router';
import { Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setMobileMenuOpen(false); // Close mobile menu if open
    logout();
    // Use setTimeout to avoid race conditions with React Router
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 0);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/properties', label: 'All Properties' },
    { path: '/contact', label: 'Contact Us' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <header className="bg-gradient-to-r from-[#3a3a3a] via-[#4a5940] to-[#6B7C3C] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-[#C9B99B]" />
              <span className="text-xl font-semibold text-white">Skyway Suites</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-[#C9B99B] border-b-2 border-[#C9B99B] pb-1'
                      : 'text-white hover:text-[#C9B99B]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-white">Hello, {user?.name || 'User'}</span>
                  {!isAdmin && (
                    <>
                      <Link to="/my-bookings">
                        <Button variant="outline" size="sm" className="bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                          My Bookings
                        </Button>
                      </Link>
                      <Link to="/profile">
                        <Button variant="outline" size="sm" className="bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                          My Profile
                        </Button>
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="outline" size="sm" className="bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                      Login
                    </Button>
                  </Link>
                  <Link to="/create-account">
                    <Button size="sm" className="bg-[#C9B99B] text-[#3a3a3a] hover:bg-[#d4c4a8]">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-out Menu */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-72 z-50
          bg-gradient-to-b from-[#3a3a3a] via-[#4a5940] to-[#6B7C3C]
          shadow-2xl transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          md:hidden
        `}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center p-4 border-b border-white/20">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <Building2 className="h-6 w-6 text-[#C9B99B]" />
            <span className="font-semibold text-white">Skyway Suites</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white hover:text-[#C9B99B] transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex flex-col p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-white/20 text-[#C9B99B]'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Auth Section */}
        <div className="p-4 border-t border-white/20 mt-auto">
          {user ? (
            <div className="space-y-3">
              <div className="px-4 py-2 text-white">
                <p className="text-xs text-white/70">Logged in as</p>
                <p className="font-semibold">{user?.name || 'User'}</p>
              </div>
              {!isAdmin && (
                <>
                  <Link to="/my-bookings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                      My Bookings
                    </Button>
                  </Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                      My Profile
                    </Button>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full bg-transparent text-white border-white hover:bg-white hover:text-[#3a3a3a]">
                  Login
                </Button>
              </Link>
              <Link to="/create-account" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full bg-[#C9B99B] text-[#3a3a3a] hover:bg-[#d4c4a8]">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}