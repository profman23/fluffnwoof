import dotenv from 'dotenv';

dotenv.config();

// Parse CORS origins - supports comma-separated values
const getCorsOrigins = (): string | string[] | boolean => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // In development, allow all origins for mobile testing
  if (nodeEnv === 'development') {
    return true; // Allow all origins
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    // Default origins including Capacitor mobile app origins
    return [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'capacitor://localhost',
      'http://localhost',
    ];
  }
  // Support multiple origins separated by comma
  if (frontendUrl.includes(',')) {
    return frontendUrl.split(',').map(url => url.trim());
  }
  return frontendUrl;
};

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
};
