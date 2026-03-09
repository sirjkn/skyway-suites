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
    getProperties().then((data) => setProperties(data.slice(0, 3)));
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
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroBackground}')`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-6xl mb-6">
              Find Your Perfect Stay !
            </h1>
            <p className="text-xl mb-8">
              Discover unforgettable experiences around in Nairobi and its Environs
            </p>
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
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">Prime Locations</h3>
              <p className="text-gray-600">
                Properties in the most desirable destinations worldwide
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Safe and encrypted payment processing for your peace of mind
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">Easy Booking</h3>
              <p className="text-gray-600">
                Simple and secure booking process with instant confirmation
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">Quality Guaranteed</h3>
              <p className="text-gray-600">
                Every property meets our high standards for cleanliness and comfort
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer service to assist you anytime
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-[#E8E3DB] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-[#6B7C3C]" />
              </div>
              <h3 className="text-xl mb-2">Best Price Match</h3>
              <p className="text-gray-600">
                Competitive pricing with no hidden fees or surprise charges
              </p>
            </div>
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