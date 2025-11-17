import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary with organized folder structure
 * Format: sellerId/productId/image.jpg
 */
export async function uploadProductImage(
  imageBuffer: Buffer,
  sellerId: string,
  productId: string,
  filename: string
): Promise<string> {
  try {
    const folder = `sellers/${sellerId}/products/${productId}`;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url || '');
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload seller storefront image (logo/banner)
 * Format: sellerId/storefront/logo.jpg or banner.jpg
 */
export async function uploadStorefrontImage(
  imageBuffer: Buffer,
  sellerId: string,
  type: 'logo' | 'banner'
): Promise<string> {
  try {
    const folder = `sellers/${sellerId}/storefront`;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: type,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url || '');
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload storefront image');
  }
}

/**
 * Upload KYC document
 * Format: sellerId/kyc/document.jpg
 */
export async function uploadKYCDocument(
  imageBuffer: Buffer,
  sellerId: string,
  filename: string
): Promise<string> {
  try {
    const folder = `sellers/${sellerId}/kyc`;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename.replace(/\.[^/.]+$/, ''),
          resource_type: 'auto',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result?.secure_url || '');
          }
        }
      );

      uploadStream.end(imageBuffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload KYC document');
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteCloudinaryImage(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleCloudinaryImages(imageUrls: string[]): Promise<void> {
  try {
    const deletePromises = imageUrls.map(url => deleteCloudinaryImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw new Error('Failed to delete images');
  }
}

/**
 * Delete entire product folder from Cloudinary
 */
export async function deleteProductFolder(sellerId: string, productId: string): Promise<void> {
  try {
    const folder = `sellers/${sellerId}/products/${productId}`;
    await cloudinary.api.delete_resources_by_prefix(folder);
    await cloudinary.api.delete_folder(folder);
  } catch (error) {
    console.error('Error deleting product folder:', error);
    throw new Error('Failed to delete product folder');
  }
}

export default cloudinary;
