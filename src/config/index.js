import dotenv from 'dotenv';
dotenv.config();

const config = {
    PORT: process.env.PORT || 8080,
    MONGO_URI: process.env.MONGO_URI, 
    SECRET: process.env.SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME || '1h', 
    JWT_COOKIE_MAX_AGE_MS: parseInt(process.env.JWT_COOKIE_MAX_AGE_MS || '3600000', 10),
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,       
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
    MAILING_SERVICE: process.env.MAILING_SERVICE,
    MAILING_USER: process.env.MAILING_USER,
    MAILING_PASSWORD: process.env.MAILING_PASSWORD,
    RESET_PASSWORD_TOKEN_EXPIRATION: parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRATION || '3600', 10)
};
//console.log("CONFIG: JWT_SECRET desde index.js:", config.JWT_SECRET); 
export default config;