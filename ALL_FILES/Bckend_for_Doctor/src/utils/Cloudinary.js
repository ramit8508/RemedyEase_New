import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary with your environment variables
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// This function takes a file buffer (from memory) and uploads it to Cloudinary
const uploadOnCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('No file buffer was provided.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "remedyease_avatars" }, // A folder for your user avatars
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Use streamifier to read the buffer and pipe it to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export { uploadOnCloudinary };