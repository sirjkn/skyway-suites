import { Link } from 'react-router';
import { MapPin, Calendar, Users, Shield, Star, Clock, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import { getProperties, Property, getHeroSettings } from '../lib/api';
import { PropertyCard } from '../components/PropertyCard';

export function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [heroBackground, setHeroBackground] = useState('https://images.unsplash.com/photo-1741991109886-90e70988f27b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYWlyb2JpJTIwS2VueWElMjBjaXR5c2NhcGUlMjBza3lsaW5lfGVufDF8fHx8MTc3MzAzNTM5OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral');

  useEffect(() => {
    getProperties().then((data) => setProperties(data.slice(0, 6)));
    getHeroSettings().then((settings) => {
      if (settings?.backgroundImage) {
        setHeroBackground(settings.backgroundImage);
      }
    });
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroBackground}')`,
        }}
      >
        <div className="absolute inset-0 flex items-end justify-center pb-12">
          <div className="text-center text-white max-w-2xl px-4">
            <h1 className="text-2xl md:text-3xl mb-3">
              Find Your Perfect Stay !
            </h1>
            <p className="text-sm md:text-base">
              Discover unforgettable experiences around Nairobi and its Environs
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl mb-2">Featured Properties</h2>
              <p className="text-gray-600">Handpicked stays for your next adventure</p>
            </div>
            <Link to="/properties">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4">Why Choose Skyway Suites?</h2>
            <p className="text-gray-600">Experience the best in vacation rentals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">Prime Locations</h3>
              <p className="text-sm text-white">
                Properties in the most desirable destinations worldwide
              </p>
            </div>
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">Secure Payments</h3>
              <p className="text-sm text-white">
                Safe and encrypted payment processing for your peace of mind
              </p>
            </div>
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">Easy Booking</h3>
              <p className="text-sm text-white">
                Simple and secure booking process with instant confirmation
              </p>
            </div>
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">Quality Guaranteed</h3>
              <p className="text-sm text-white">
                Every property meets our high standards for cleanliness and comfort
              </p>
            </div>
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">24/7 Support</h3>
              <p className="text-sm text-white">
                Round-the-clock customer service to assist you anytime
              </p>
            </div>
            <div className="text-center p-6 bg-[#6B7C3C] rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-12 h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg mb-2 text-white">Best Price Match</h3>
              <p className="text-sm text-white">
                Competitive pricing with no hidden fees or surprise charges
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#6B7C3C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8">Join thousands of happy travelers</p>
          <Link to="/create-account">
            <Button size="lg" variant="secondary">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}