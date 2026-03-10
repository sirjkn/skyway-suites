// Cloudinary upload utility with signed uploads

interface CloudinaryUploadResponse {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Default Cloudinary credentials
const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'dc5d5zfos',
  apiKey: '382325619466152',
  apiSecret: '-TZoR9QSDk1lMfEOdQc-Tv59f9A',
};

/**
 * Gets Cloudinary configuration from database settings or defaults
 */
export async function getCloudinaryConfig(): Promise<CloudinaryConfig> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/settings?category=cloudinary`);
    
    if (response.ok) {
      const settings = await response.json();
      
      // If we have all settings from database, use them
      if (settings.cloud_name && settings.api_key && settings.api_secret) {
        return {
          cloudName: settings.cloud_name,
          apiKey: settings.api_key,
          apiSecret: settings.api_secret,
        };
      }
    }
  } catch (error) {
    console.log('Could not fetch Cloudinary settings from database, using defaults');
  }
  
  // Fall back to default configuration
  return DEFAULT_CLOUDINARY_CONFIG;
}

/**
 * Saves Cloudinary configuration to database
 */
export async function saveCloudinaryConfig(config: CloudinaryConfig): Promise<void> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/settings?category=cloudinary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save Cloudinary settings');
    }
  } catch (error) {
    console.error('Error saving Cloudinary config:', error);
    throw error;
  }
}

/**
 * Generates signature for signed Cloudinary upload
 */
async function generateSignature(
  paramsToSign: Record<string, string>,
  apiSecret: string
): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');
  
  const stringToSign = `${sortedParams}${apiSecret}`;
  
  // Use Web Crypto API to generate SHA-1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Uploads an image to Cloudinary using signed upload
 * @param dataUrl - Base64 data URL of the image
 * @param config - Optional Cloudinary configuration (uses defaults if not provided)
 * @returns Promise with Cloudinary response containing the image URL
 */
export async function uploadToCloudinary(
  dataUrl: string,
  config?: CloudinaryConfig
): Promise<CloudinaryUploadResponse> {
  // Get configuration (from parameter or fetch from database)
  const cloudinaryConfig = config || await getCloudinaryConfig();
  
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig;
  
  // Prepare upload parameters
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = 'skyway-suites';
  
  const paramsToSign: Record<string, string> = {
    timestamp,
    folder,
  };
  
  // Generate signature
  const signature = await generateSignature(paramsToSign, apiSecret);
  
  const formData = new FormData();
  
  // Convert data URL to blob
  const blob = await fetch(dataUrl).then(res => res.blob());
  
  formData.append('file', blob);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    
    return {
      url: data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
