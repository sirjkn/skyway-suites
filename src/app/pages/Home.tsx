import { Link } from 'react-router';
import { MapPin, Calendar, Users, Shield, Star, Clock, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import { getProperties, Property, getHeroSettings } from '../lib/api';
import { PropertyCard } from '../components/PropertyCard';
import { SEO } from '../components/SEO';
import { OrganizationStructuredData, BreadcrumbStructuredData } from '../components/StructuredData';

export function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [heroBackground, setHeroBackground] = useState('https://res.cloudinary.com/dc5d5zfos/image/upload/v1773130653/skyway-suites/teaska4iahwhiwottlpg.webp');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    getProperties().then((data) => setProperties(data.slice(0, 6)));
    getHeroSettings().then((settings) => {
      if (settings?.backgroundImages && settings.backgroundImages.length > 0) {
        setHeroImages(settings.backgroundImages);
        setHeroBackground(settings.backgroundImages[0]);
      } else if (settings?.backgroundImage) {
        setHeroBackground(settings.backgroundImage);
        setHeroImages([settings.backgroundImage]);
      }
    });
  }, []);
  
  // Auto-advance hero carousel every 5 seconds
  useEffect(() => {
    if (heroImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div>
      <SEO 
        title="Skyway Suites - Premium Vacation Rentals in Kenya"
        description="Discover luxury vacation rentals and accommodation in Nairobi and its environs. Book your perfect stay with Skyway Suites - verified properties, best prices, instant booking."
        url="/"
        keywords={[
          'vacation rentals',
          'Nairobi hotels',
          'Kenya accommodation',
          'luxury suites',
          'short term rental',
          'Airbnb Kenya',
          'serviced apartments',
        ]}
      />
      <OrganizationStructuredData />
      <BreadcrumbStructuredData items={[{ name: 'Home', url: '/' }]} />
      
      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        {/* Hero Image Carousel */}
        <div className="absolute inset-0 transition-opacity duration-1000">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${heroImages.length > 0 ? heroImages[currentHeroIndex] : heroBackground}')`,
            }}
          />
        </div>
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-12 bg-gradient-to-t from-black/30 via-transparent to-transparent">
          <div className="text-center text-white max-w-2xl px-4">
            <h1 className="text-2xl md:text-3xl mb-3">
              Find Your Perfect Stay !
            </h1>
            <p className="text-sm md:text-base">
              Discover unforgettable experiences around Nairobi and its Environs
            </p>
          </div>
        </div>
        
        {/* Carousel Navigation Dots */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentHeroIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8">
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">Prime Locations</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Properties in the most desirable destinations worldwide
              </p>
            </div>
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">Secure Payments</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Safe and encrypted payment processing for your peace of mind
              </p>
            </div>
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">Easy Booking</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Simple and secure booking process with instant confirmation
              </p>
            </div>
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <Star className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">Quality Guaranteed</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Every property meets our high standards for cleanliness and comfort
              </p>
            </div>
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">24/7 Support</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Round-the-clock customer service to assist you anytime
              </p>
            </div>
            <div className="text-center p-3 sm:p-6 bg-[#6B7C3C] rounded-lg sm:rounded-2xl hover:bg-[#C9B99B] transition-colors duration-300 flex flex-col items-center justify-start h-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-[#3a3a3a] rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-lg mb-1 sm:mb-2 text-white">Best Price Match</h3>
              <p className="text-[10px] sm:text-sm text-white leading-tight sm:leading-normal">
                Competitive pricing with no hidden fees or surprise charges
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#C9B99B] text-[#3a3a3a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8">Join thousands of happy travelers</p>
          <Link to="/create-account">
            <Button size="lg" variant="secondary" className="border-2 border-white">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}