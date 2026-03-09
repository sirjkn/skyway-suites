// Image compression and conversion utilities

export interface CompressedImage {
  dataUrl: string;
  size: number;
  fileName: string;
}

/**
 * Compresses an image to WebP format with maximum file size of 50KB
 * @param file - The image file to compress
 * @param maxSizeKB - Maximum size in KB (default: 50)
 * @returns Promise with compressed image data URL
 */
export async function compressImageToWebP(
  file: File,
  maxSizeKB: number = 50
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920; // Max width/height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with quality 0.9 and reduce until file size is acceptable
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/webp', quality);
        let sizeInKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        
        // Reduce quality until size is under maxSizeKB
        while (sizeInKB > maxSizeKB && quality > 0.1) {
          quality -= 0.05;
          dataUrl = canvas.toDataURL('image/webp', quality);
          sizeInKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        }
        
        // If still too large, reduce dimensions
        if (sizeInKB > maxSizeKB) {
          const scale = Math.sqrt(maxSizeKB / sizeInKB);
          canvas.width = width * scale;
          canvas.height = height * scale;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/webp', 0.8);
          sizeInKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        }
        
        resolve({
          dataUrl,
          size: sizeInKB,
          fileName: file.name.replace(/\.[^/.]+$/, '.webp'),
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses multiple images to WebP format
 * @param files - Array of image files to compress
 * @param maxSizeKB - Maximum size in KB per image (default: 50)
 * @returns Promise with array of compressed image data URLs
 */
export async function compressMultipleImages(
  files: File[],
  maxSizeKB: number = 50
): Promise<CompressedImage[]> {
  const compressionPromises = files.map(file => compressImageToWebP(file, maxSizeKB));
  return Promise.all(compressionPromises);
}
