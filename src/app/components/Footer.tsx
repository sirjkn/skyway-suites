import { Building2 } from 'lucide-react';
import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { getCompanyInfo, CompanyInfo } from '../lib/api';

export function Footer() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const data = await getCompanyInfo();
        setCompanyInfo(data);
      } catch (error) {
        console.error('Failed to load company info:', error);
      }
    };
    loadCompanyInfo();
  }, []);

  return (
    <footer className="bg-[#3a3a3a] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-[#C9B99B]" />
              <span className="text-xl font-semibold text-white">Skyway Suites</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              Your trusted partner for premium vacation rentals and accommodations worldwide.
              Experience comfort and luxury with Skyway Suites.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-[#C9B99B] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-[#C9B99B] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/properties" className="text-sm hover:text-[#C9B99B] transition-colors">
                  All Properties
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-[#C9B99B] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              {companyInfo?.email && <li>Email: {companyInfo.email}</li>}
              {companyInfo?.phone && <li>Phone: {companyInfo.phone}</li>}
              {companyInfo?.address && <li>{companyInfo.address}</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Skyway Suites. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}