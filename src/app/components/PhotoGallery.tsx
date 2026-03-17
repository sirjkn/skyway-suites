import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoWithCategory {
  url: string;
  category: string;
}

interface PhotoGalleryProps {
  photos?: string[];
  categorizedPhotos?: {
    livingRoom?: string[];
    bedroom?: string[];
    kitchen?: string[];
    dining?: string[];
    amenities?: string[];
  };
}

export function PhotoGallery({ photos, categorizedPhotos }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Build array of photos with categories
  const allPhotos: PhotoWithCategory[] = [];
  
  if (categorizedPhotos) {
    if (categorizedPhotos.livingRoom) {
      categorizedPhotos.livingRoom.forEach(url => allPhotos.push({ url, category: 'Living Room' }));
    }
    if (categorizedPhotos.bedroom) {
      categorizedPhotos.bedroom.forEach(url => allPhotos.push({ url, category: 'Bedroom' }));
    }
    if (categorizedPhotos.kitchen) {
      categorizedPhotos.kitchen.forEach(url => allPhotos.push({ url, category: 'Kitchen' }));
    }
    if (categorizedPhotos.dining) {
      categorizedPhotos.dining.forEach(url => allPhotos.push({ url, category: 'Dining' }));
    }
    if (categorizedPhotos.amenities) {
      categorizedPhotos.amenities.forEach(url => allPhotos.push({ url, category: 'Amenities' }));
    }
  }
  
  // Fallback to uncategorized photos
  if (allPhotos.length === 0 && photos) {
    photos.forEach(url => allPhotos.push({ url, category: 'General' }));
  }

  if (allPhotos.length === 0) {
    return null;
  }

  const openGallery = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeGallery = () => {
    setSelectedIndex(null);
    document.body.style.overflow = '';
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % allPhotos.length);
    }
  };

  const goToPrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + allPhotos.length) % allPhotos.length);
    }
  };

  return (
    <>
      {/* Thumbnail Marquee */}
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-4"
          animate={{
            x: [0, -allPhotos.length * 280],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: allPhotos.length * 5,
              ease: 'linear',
            },
          }}
        >
          {[...allPhotos, ...allPhotos].map((photo, index) => (
            <div
              key={`${photo.url}-${index}`}
              className="flex-shrink-0 w-64 h-48 cursor-pointer rounded-lg overflow-hidden relative group"
              onClick={() => openGallery(index % allPhotos.length)}
            >
              <img
                src={photo.url}
                alt={`Gallery photo ${(index % allPhotos.length) + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
              {/* Category Badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                {photo.category}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Full Screen Slider */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={closeGallery}
          >
            {/* Blurred Background */}
            <div
              className="absolute inset-0 backdrop-blur-xl"
              style={{
                backgroundImage: `url(${allPhotos[selectedIndex].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(0.5)',
              }}
            />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
              {/* Close Button */}
              <button
                onClick={closeGallery}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
              >
                <X className="w-8 h-8 text-white" />
              </button>

              {/* Previous Button */}
              {allPhotos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="absolute left-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
              )}

              {/* Image */}
              <motion.img
                key={selectedIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={allPhotos[selectedIndex].url}
                alt={`Gallery photo ${selectedIndex + 1}`}
                className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Category Badge on Fullscreen */}
              <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
                {allPhotos[selectedIndex].category}
              </div>

              {/* Next Button */}
              {allPhotos.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white">
                {selectedIndex + 1} / {allPhotos.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}