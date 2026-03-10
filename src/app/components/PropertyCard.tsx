import { Link } from 'react-router';
import { MapPin, Users, Bed, Bath } from 'lucide-react';
import { Property, generatePropertySlug } from '../lib/api';
import { Card, CardContent } from './ui/card';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const slug = generatePropertySlug(property.title, property.id);
  
  console.log('🏠 PropertyCard:', {
    id: property.id,
    title: property.title,
    generatedSlug: slug,
    linkTo: `/properties/${slug}`
  });
  
  return (
    <Link to={`/properties/${slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          <div
            className="h-48 bg-cover bg-center"
            style={{ backgroundImage: `url('${property.image}')` }}
          />
          {/* Price Badge - Positioned inside photo */}
          <div className="absolute bottom-3 right-3 bg-red-600 text-white px-3 py-1.5 rounded-md font-semibold shadow-lg">
            ${property.price}/night
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
          
          {/* Category Badge - Below title with black bg */}
          <div className="mb-3">
            <span className="inline-block bg-black text-white text-xs px-2.5 py-1 rounded-md">
              {property.category}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            {property.location}
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {property.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {property.guests}
            </div>
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms}
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}