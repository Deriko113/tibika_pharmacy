function getEnv() {
    const NODE_ENV = process.env.NODE_ENV;
    const PORT = process.env.PORT;
    const DB_HOST = process.env.DB_HOST;
    const DB_USER = process.env.DB_USER;
    const DB_PASSWORD = process.env.DB_PASSWORD;
    const DB_NAME = process.env.DB_NAME;
    const CURRENCY = process.env.CURRENCY;
    const COUNTRY = process.env.COUNTRY;
    const DELIVERY_FEE = process.env.DELIVERY_FEE;
    const TAX_RATE = process.env.TAX_RATE;
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

    return {
        NODE_ENV,
        PORT,
        DB_HOST,
        DB_USER,
        DB_PASSWORD,
        DB_NAME,
        CURRENCY,
        COUNTRY,
        DELIVERY_FEE,
        TAX_RATE,
        JWT_SECRET,
        JWT_EXPIRES_IN,
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET
    };
}

module.exports = getEnv;