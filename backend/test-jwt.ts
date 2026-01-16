import jwt from 'jsonwebtoken';
import { config } from './src/config/env';

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNiNTc0ZmJhLWRmZWQtNDNhZS1hNDQxLWU4MDg5ZTVhMGRmOCIsImVtYWlsIjoiYWRtaW5AZmx1ZmZud29vZi5jb20iLCJyb2xlIjoiQURNSU4iLCJmaXJzdE5hbWUiOiLYo9it2YXYryIsImxhc3ROYW1lIjoi2YXYrdmF2K8iLCJpYXQiOjE3Njc4ODQzODUsImV4cCI6MTc2ODQ4OTE4NX0.JlsxYOmLXKYuMbAh8X2vp8rE2Zg1ImCZTKfCpL0RW94";

try {
  const decoded = jwt.verify(token, config.jwt.secret);
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
} catch (error: any) {
  if (error.name === 'TokenExpiredError') {
    const decoded = jwt.decode(token);
    console.log('Expired token (decoded without verification):', JSON.stringify(decoded, null, 2));
  } else {
    console.error('Error:', error.message);
  }
}
