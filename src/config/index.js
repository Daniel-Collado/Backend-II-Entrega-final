
import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: process.env.PORT || 8080,
    MONGO_URI: process.env.MONGO_URI, 
    SECRET: process.env.SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,       
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET 
};
//console.log("CONFIG: JWT_SECRET desde index.js:", config.JWT_SECRET); 
export default config;