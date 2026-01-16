import { Request, Response, NextFunction } from 'express';

export const languageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const acceptLanguage = req.headers['accept-language'];

  // Extract language code (handle 'en-US' -> 'en', etc.)
  let lang = 'ar'; // Default to Arabic

  if (acceptLanguage) {
    const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (primaryLang === 'en' || primaryLang === 'ar') {
      lang = primaryLang;
    }
  }

  // Attach to request for use in controllers/services
  (req as any).language = lang;

  next();
};
