/**
 * Country Codes Data
 * Complete list of countries with dial codes and emoji flags
 * Gulf countries are prioritized at the top, Saudi Arabia as default
 */

export interface Country {
  code: string;      // ISO 3166-1 alpha-2
  nameEn: string;    // English name
  nameAr: string;    // Arabic name
  dialCode: string;  // Phone dial code
  flag: string;      // Emoji flag
  priority?: number; // Lower = higher priority (Gulf countries)
}

// Gulf countries (priority 1-10)
const gulfCountries: Country[] = [
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية', dialCode: '+966', flag: '🇸🇦', priority: 1 },
  { code: 'AE', nameEn: 'United Arab Emirates', nameAr: 'الإمارات', dialCode: '+971', flag: '🇦🇪', priority: 2 },
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', dialCode: '+965', flag: '🇰🇼', priority: 3 },
  { code: 'BH', nameEn: 'Bahrain', nameAr: 'البحرين', dialCode: '+973', flag: '🇧🇭', priority: 4 },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', dialCode: '+974', flag: '🇶🇦', priority: 5 },
  { code: 'OM', nameEn: 'Oman', nameAr: 'عُمان', dialCode: '+968', flag: '🇴🇲', priority: 6 },
];

// Arab countries (priority 11-30)
const arabCountries: Country[] = [
  { code: 'EG', nameEn: 'Egypt', nameAr: 'مصر', dialCode: '+20', flag: '🇪🇬', priority: 11 },
  { code: 'JO', nameEn: 'Jordan', nameAr: 'الأردن', dialCode: '+962', flag: '🇯🇴', priority: 12 },
  { code: 'LB', nameEn: 'Lebanon', nameAr: 'لبنان', dialCode: '+961', flag: '🇱🇧', priority: 13 },
  { code: 'SY', nameEn: 'Syria', nameAr: 'سوريا', dialCode: '+963', flag: '🇸🇾', priority: 14 },
  { code: 'IQ', nameEn: 'Iraq', nameAr: 'العراق', dialCode: '+964', flag: '🇮🇶', priority: 15 },
  { code: 'YE', nameEn: 'Yemen', nameAr: 'اليمن', dialCode: '+967', flag: '🇾🇪', priority: 16 },
  { code: 'PS', nameEn: 'Palestine', nameAr: 'فلسطين', dialCode: '+970', flag: '🇵🇸', priority: 17 },
  { code: 'SD', nameEn: 'Sudan', nameAr: 'السودان', dialCode: '+249', flag: '🇸🇩', priority: 18 },
  { code: 'LY', nameEn: 'Libya', nameAr: 'ليبيا', dialCode: '+218', flag: '🇱🇾', priority: 19 },
  { code: 'TN', nameEn: 'Tunisia', nameAr: 'تونس', dialCode: '+216', flag: '🇹🇳', priority: 20 },
  { code: 'DZ', nameEn: 'Algeria', nameAr: 'الجزائر', dialCode: '+213', flag: '🇩🇿', priority: 21 },
  { code: 'MA', nameEn: 'Morocco', nameAr: 'المغرب', dialCode: '+212', flag: '🇲🇦', priority: 22 },
  { code: 'MR', nameEn: 'Mauritania', nameAr: 'موريتانيا', dialCode: '+222', flag: '🇲🇷', priority: 23 },
  { code: 'SO', nameEn: 'Somalia', nameAr: 'الصومال', dialCode: '+252', flag: '🇸🇴', priority: 24 },
  { code: 'DJ', nameEn: 'Djibouti', nameAr: 'جيبوتي', dialCode: '+253', flag: '🇩🇯', priority: 25 },
  { code: 'KM', nameEn: 'Comoros', nameAr: 'جزر القمر', dialCode: '+269', flag: '🇰🇲', priority: 26 },
];

// Rest of the world (alphabetically, priority 100+)
const otherCountries: Country[] = [
  { code: 'AF', nameEn: 'Afghanistan', nameAr: 'أفغانستان', dialCode: '+93', flag: '🇦🇫', priority: 100 },
  { code: 'AL', nameEn: 'Albania', nameAr: 'ألبانيا', dialCode: '+355', flag: '🇦🇱', priority: 100 },
  { code: 'AD', nameEn: 'Andorra', nameAr: 'أندورا', dialCode: '+376', flag: '🇦🇩', priority: 100 },
  { code: 'AO', nameEn: 'Angola', nameAr: 'أنغولا', dialCode: '+244', flag: '🇦🇴', priority: 100 },
  { code: 'AG', nameEn: 'Antigua and Barbuda', nameAr: 'أنتيغوا وبربودا', dialCode: '+1268', flag: '🇦🇬', priority: 100 },
  { code: 'AR', nameEn: 'Argentina', nameAr: 'الأرجنتين', dialCode: '+54', flag: '🇦🇷', priority: 100 },
  { code: 'AM', nameEn: 'Armenia', nameAr: 'أرمينيا', dialCode: '+374', flag: '🇦🇲', priority: 100 },
  { code: 'AU', nameEn: 'Australia', nameAr: 'أستراليا', dialCode: '+61', flag: '🇦🇺', priority: 100 },
  { code: 'AT', nameEn: 'Austria', nameAr: 'النمسا', dialCode: '+43', flag: '🇦🇹', priority: 100 },
  { code: 'AZ', nameEn: 'Azerbaijan', nameAr: 'أذربيجان', dialCode: '+994', flag: '🇦🇿', priority: 100 },
  { code: 'BS', nameEn: 'Bahamas', nameAr: 'الباهاما', dialCode: '+1242', flag: '🇧🇸', priority: 100 },
  { code: 'BD', nameEn: 'Bangladesh', nameAr: 'بنغلاديش', dialCode: '+880', flag: '🇧🇩', priority: 100 },
  { code: 'BB', nameEn: 'Barbados', nameAr: 'باربادوس', dialCode: '+1246', flag: '🇧🇧', priority: 100 },
  { code: 'BY', nameEn: 'Belarus', nameAr: 'بيلاروسيا', dialCode: '+375', flag: '🇧🇾', priority: 100 },
  { code: 'BE', nameEn: 'Belgium', nameAr: 'بلجيكا', dialCode: '+32', flag: '🇧🇪', priority: 100 },
  { code: 'BZ', nameEn: 'Belize', nameAr: 'بليز', dialCode: '+501', flag: '🇧🇿', priority: 100 },
  { code: 'BJ', nameEn: 'Benin', nameAr: 'بنين', dialCode: '+229', flag: '🇧🇯', priority: 100 },
  { code: 'BT', nameEn: 'Bhutan', nameAr: 'بوتان', dialCode: '+975', flag: '🇧🇹', priority: 100 },
  { code: 'BO', nameEn: 'Bolivia', nameAr: 'بوليفيا', dialCode: '+591', flag: '🇧🇴', priority: 100 },
  { code: 'BA', nameEn: 'Bosnia and Herzegovina', nameAr: 'البوسنة والهرسك', dialCode: '+387', flag: '🇧🇦', priority: 100 },
  { code: 'BW', nameEn: 'Botswana', nameAr: 'بوتسوانا', dialCode: '+267', flag: '🇧🇼', priority: 100 },
  { code: 'BR', nameEn: 'Brazil', nameAr: 'البرازيل', dialCode: '+55', flag: '🇧🇷', priority: 100 },
  { code: 'BN', nameEn: 'Brunei', nameAr: 'بروناي', dialCode: '+673', flag: '🇧🇳', priority: 100 },
  { code: 'BG', nameEn: 'Bulgaria', nameAr: 'بلغاريا', dialCode: '+359', flag: '🇧🇬', priority: 100 },
  { code: 'BF', nameEn: 'Burkina Faso', nameAr: 'بوركينا فاسو', dialCode: '+226', flag: '🇧🇫', priority: 100 },
  { code: 'BI', nameEn: 'Burundi', nameAr: 'بوروندي', dialCode: '+257', flag: '🇧🇮', priority: 100 },
  { code: 'KH', nameEn: 'Cambodia', nameAr: 'كمبوديا', dialCode: '+855', flag: '🇰🇭', priority: 100 },
  { code: 'CM', nameEn: 'Cameroon', nameAr: 'الكاميرون', dialCode: '+237', flag: '🇨🇲', priority: 100 },
  { code: 'CA', nameEn: 'Canada', nameAr: 'كندا', dialCode: '+1', flag: '🇨🇦', priority: 100 },
  { code: 'CV', nameEn: 'Cape Verde', nameAr: 'الرأس الأخضر', dialCode: '+238', flag: '🇨🇻', priority: 100 },
  { code: 'CF', nameEn: 'Central African Republic', nameAr: 'جمهورية أفريقيا الوسطى', dialCode: '+236', flag: '🇨🇫', priority: 100 },
  { code: 'TD', nameEn: 'Chad', nameAr: 'تشاد', dialCode: '+235', flag: '🇹🇩', priority: 100 },
  { code: 'CL', nameEn: 'Chile', nameAr: 'تشيلي', dialCode: '+56', flag: '🇨🇱', priority: 100 },
  { code: 'CN', nameEn: 'China', nameAr: 'الصين', dialCode: '+86', flag: '🇨🇳', priority: 100 },
  { code: 'CO', nameEn: 'Colombia', nameAr: 'كولومبيا', dialCode: '+57', flag: '🇨🇴', priority: 100 },
  { code: 'CG', nameEn: 'Congo', nameAr: 'الكونغو', dialCode: '+242', flag: '🇨🇬', priority: 100 },
  { code: 'CD', nameEn: 'Congo (DRC)', nameAr: 'الكونغو الديمقراطية', dialCode: '+243', flag: '🇨🇩', priority: 100 },
  { code: 'CR', nameEn: 'Costa Rica', nameAr: 'كوستاريكا', dialCode: '+506', flag: '🇨🇷', priority: 100 },
  { code: 'CI', nameEn: 'Côte d\'Ivoire', nameAr: 'ساحل العاج', dialCode: '+225', flag: '🇨🇮', priority: 100 },
  { code: 'HR', nameEn: 'Croatia', nameAr: 'كرواتيا', dialCode: '+385', flag: '🇭🇷', priority: 100 },
  { code: 'CU', nameEn: 'Cuba', nameAr: 'كوبا', dialCode: '+53', flag: '🇨🇺', priority: 100 },
  { code: 'CY', nameEn: 'Cyprus', nameAr: 'قبرص', dialCode: '+357', flag: '🇨🇾', priority: 100 },
  { code: 'CZ', nameEn: 'Czech Republic', nameAr: 'التشيك', dialCode: '+420', flag: '🇨🇿', priority: 100 },
  { code: 'DK', nameEn: 'Denmark', nameAr: 'الدنمارك', dialCode: '+45', flag: '🇩🇰', priority: 100 },
  { code: 'DO', nameEn: 'Dominican Republic', nameAr: 'جمهورية الدومينيكان', dialCode: '+1809', flag: '🇩🇴', priority: 100 },
  { code: 'EC', nameEn: 'Ecuador', nameAr: 'الإكوادور', dialCode: '+593', flag: '🇪🇨', priority: 100 },
  { code: 'SV', nameEn: 'El Salvador', nameAr: 'السلفادور', dialCode: '+503', flag: '🇸🇻', priority: 100 },
  { code: 'GQ', nameEn: 'Equatorial Guinea', nameAr: 'غينيا الاستوائية', dialCode: '+240', flag: '🇬🇶', priority: 100 },
  { code: 'ER', nameEn: 'Eritrea', nameAr: 'إريتريا', dialCode: '+291', flag: '🇪🇷', priority: 100 },
  { code: 'EE', nameEn: 'Estonia', nameAr: 'إستونيا', dialCode: '+372', flag: '🇪🇪', priority: 100 },
  { code: 'SZ', nameEn: 'Eswatini', nameAr: 'إسواتيني', dialCode: '+268', flag: '🇸🇿', priority: 100 },
  { code: 'ET', nameEn: 'Ethiopia', nameAr: 'إثيوبيا', dialCode: '+251', flag: '🇪🇹', priority: 100 },
  { code: 'FJ', nameEn: 'Fiji', nameAr: 'فيجي', dialCode: '+679', flag: '🇫🇯', priority: 100 },
  { code: 'FI', nameEn: 'Finland', nameAr: 'فنلندا', dialCode: '+358', flag: '🇫🇮', priority: 100 },
  { code: 'FR', nameEn: 'France', nameAr: 'فرنسا', dialCode: '+33', flag: '🇫🇷', priority: 100 },
  { code: 'GA', nameEn: 'Gabon', nameAr: 'الغابون', dialCode: '+241', flag: '🇬🇦', priority: 100 },
  { code: 'GM', nameEn: 'Gambia', nameAr: 'غامبيا', dialCode: '+220', flag: '🇬🇲', priority: 100 },
  { code: 'GE', nameEn: 'Georgia', nameAr: 'جورجيا', dialCode: '+995', flag: '🇬🇪', priority: 100 },
  { code: 'DE', nameEn: 'Germany', nameAr: 'ألمانيا', dialCode: '+49', flag: '🇩🇪', priority: 100 },
  { code: 'GH', nameEn: 'Ghana', nameAr: 'غانا', dialCode: '+233', flag: '🇬🇭', priority: 100 },
  { code: 'GR', nameEn: 'Greece', nameAr: 'اليونان', dialCode: '+30', flag: '🇬🇷', priority: 100 },
  { code: 'GT', nameEn: 'Guatemala', nameAr: 'غواتيمالا', dialCode: '+502', flag: '🇬🇹', priority: 100 },
  { code: 'GN', nameEn: 'Guinea', nameAr: 'غينيا', dialCode: '+224', flag: '🇬🇳', priority: 100 },
  { code: 'GW', nameEn: 'Guinea-Bissau', nameAr: 'غينيا بيساو', dialCode: '+245', flag: '🇬🇼', priority: 100 },
  { code: 'GY', nameEn: 'Guyana', nameAr: 'غيانا', dialCode: '+592', flag: '🇬🇾', priority: 100 },
  { code: 'HT', nameEn: 'Haiti', nameAr: 'هايتي', dialCode: '+509', flag: '🇭🇹', priority: 100 },
  { code: 'HN', nameEn: 'Honduras', nameAr: 'هندوراس', dialCode: '+504', flag: '🇭🇳', priority: 100 },
  { code: 'HK', nameEn: 'Hong Kong', nameAr: 'هونغ كونغ', dialCode: '+852', flag: '🇭🇰', priority: 100 },
  { code: 'HU', nameEn: 'Hungary', nameAr: 'المجر', dialCode: '+36', flag: '🇭🇺', priority: 100 },
  { code: 'IS', nameEn: 'Iceland', nameAr: 'آيسلندا', dialCode: '+354', flag: '🇮🇸', priority: 100 },
  { code: 'IN', nameEn: 'India', nameAr: 'الهند', dialCode: '+91', flag: '🇮🇳', priority: 100 },
  { code: 'ID', nameEn: 'Indonesia', nameAr: 'إندونيسيا', dialCode: '+62', flag: '🇮🇩', priority: 100 },
  { code: 'IR', nameEn: 'Iran', nameAr: 'إيران', dialCode: '+98', flag: '🇮🇷', priority: 100 },
  { code: 'IE', nameEn: 'Ireland', nameAr: 'أيرلندا', dialCode: '+353', flag: '🇮🇪', priority: 100 },
  { code: 'IT', nameEn: 'Italy', nameAr: 'إيطاليا', dialCode: '+39', flag: '🇮🇹', priority: 100 },
  { code: 'JM', nameEn: 'Jamaica', nameAr: 'جامايكا', dialCode: '+1876', flag: '🇯🇲', priority: 100 },
  { code: 'JP', nameEn: 'Japan', nameAr: 'اليابان', dialCode: '+81', flag: '🇯🇵', priority: 100 },
  { code: 'KZ', nameEn: 'Kazakhstan', nameAr: 'كازاخستان', dialCode: '+7', flag: '🇰🇿', priority: 100 },
  { code: 'KE', nameEn: 'Kenya', nameAr: 'كينيا', dialCode: '+254', flag: '🇰🇪', priority: 100 },
  { code: 'KR', nameEn: 'South Korea', nameAr: 'كوريا الجنوبية', dialCode: '+82', flag: '🇰🇷', priority: 100 },
  { code: 'XK', nameEn: 'Kosovo', nameAr: 'كوسوفو', dialCode: '+383', flag: '🇽🇰', priority: 100 },
  { code: 'KG', nameEn: 'Kyrgyzstan', nameAr: 'قيرغيزستان', dialCode: '+996', flag: '🇰🇬', priority: 100 },
  { code: 'LA', nameEn: 'Laos', nameAr: 'لاوس', dialCode: '+856', flag: '🇱🇦', priority: 100 },
  { code: 'LV', nameEn: 'Latvia', nameAr: 'لاتفيا', dialCode: '+371', flag: '🇱🇻', priority: 100 },
  { code: 'LS', nameEn: 'Lesotho', nameAr: 'ليسوتو', dialCode: '+266', flag: '🇱🇸', priority: 100 },
  { code: 'LR', nameEn: 'Liberia', nameAr: 'ليبيريا', dialCode: '+231', flag: '🇱🇷', priority: 100 },
  { code: 'LI', nameEn: 'Liechtenstein', nameAr: 'ليختنشتاين', dialCode: '+423', flag: '🇱🇮', priority: 100 },
  { code: 'LT', nameEn: 'Lithuania', nameAr: 'ليتوانيا', dialCode: '+370', flag: '🇱🇹', priority: 100 },
  { code: 'LU', nameEn: 'Luxembourg', nameAr: 'لوكسمبورغ', dialCode: '+352', flag: '🇱🇺', priority: 100 },
  { code: 'MO', nameEn: 'Macau', nameAr: 'ماكاو', dialCode: '+853', flag: '🇲🇴', priority: 100 },
  { code: 'MK', nameEn: 'North Macedonia', nameAr: 'مقدونيا الشمالية', dialCode: '+389', flag: '🇲🇰', priority: 100 },
  { code: 'MG', nameEn: 'Madagascar', nameAr: 'مدغشقر', dialCode: '+261', flag: '🇲🇬', priority: 100 },
  { code: 'MW', nameEn: 'Malawi', nameAr: 'مالاوي', dialCode: '+265', flag: '🇲🇼', priority: 100 },
  { code: 'MY', nameEn: 'Malaysia', nameAr: 'ماليزيا', dialCode: '+60', flag: '🇲🇾', priority: 100 },
  { code: 'MV', nameEn: 'Maldives', nameAr: 'المالديف', dialCode: '+960', flag: '🇲🇻', priority: 100 },
  { code: 'ML', nameEn: 'Mali', nameAr: 'مالي', dialCode: '+223', flag: '🇲🇱', priority: 100 },
  { code: 'MT', nameEn: 'Malta', nameAr: 'مالطا', dialCode: '+356', flag: '🇲🇹', priority: 100 },
  { code: 'MX', nameEn: 'Mexico', nameAr: 'المكسيك', dialCode: '+52', flag: '🇲🇽', priority: 100 },
  { code: 'MD', nameEn: 'Moldova', nameAr: 'مولدوفا', dialCode: '+373', flag: '🇲🇩', priority: 100 },
  { code: 'MC', nameEn: 'Monaco', nameAr: 'موناكو', dialCode: '+377', flag: '🇲🇨', priority: 100 },
  { code: 'MN', nameEn: 'Mongolia', nameAr: 'منغوليا', dialCode: '+976', flag: '🇲🇳', priority: 100 },
  { code: 'ME', nameEn: 'Montenegro', nameAr: 'الجبل الأسود', dialCode: '+382', flag: '🇲🇪', priority: 100 },
  { code: 'MZ', nameEn: 'Mozambique', nameAr: 'موزمبيق', dialCode: '+258', flag: '🇲🇿', priority: 100 },
  { code: 'MM', nameEn: 'Myanmar', nameAr: 'ميانمار', dialCode: '+95', flag: '🇲🇲', priority: 100 },
  { code: 'NA', nameEn: 'Namibia', nameAr: 'ناميبيا', dialCode: '+264', flag: '🇳🇦', priority: 100 },
  { code: 'NP', nameEn: 'Nepal', nameAr: 'نيبال', dialCode: '+977', flag: '🇳🇵', priority: 100 },
  { code: 'NL', nameEn: 'Netherlands', nameAr: 'هولندا', dialCode: '+31', flag: '🇳🇱', priority: 100 },
  { code: 'NZ', nameEn: 'New Zealand', nameAr: 'نيوزيلندا', dialCode: '+64', flag: '🇳🇿', priority: 100 },
  { code: 'NI', nameEn: 'Nicaragua', nameAr: 'نيكاراغوا', dialCode: '+505', flag: '🇳🇮', priority: 100 },
  { code: 'NE', nameEn: 'Niger', nameAr: 'النيجر', dialCode: '+227', flag: '🇳🇪', priority: 100 },
  { code: 'NG', nameEn: 'Nigeria', nameAr: 'نيجيريا', dialCode: '+234', flag: '🇳🇬', priority: 100 },
  { code: 'NO', nameEn: 'Norway', nameAr: 'النرويج', dialCode: '+47', flag: '🇳🇴', priority: 100 },
  { code: 'PK', nameEn: 'Pakistan', nameAr: 'باكستان', dialCode: '+92', flag: '🇵🇰', priority: 100 },
  { code: 'PA', nameEn: 'Panama', nameAr: 'بنما', dialCode: '+507', flag: '🇵🇦', priority: 100 },
  { code: 'PG', nameEn: 'Papua New Guinea', nameAr: 'بابوا غينيا الجديدة', dialCode: '+675', flag: '🇵🇬', priority: 100 },
  { code: 'PY', nameEn: 'Paraguay', nameAr: 'باراغواي', dialCode: '+595', flag: '🇵🇾', priority: 100 },
  { code: 'PE', nameEn: 'Peru', nameAr: 'بيرو', dialCode: '+51', flag: '🇵🇪', priority: 100 },
  { code: 'PH', nameEn: 'Philippines', nameAr: 'الفلبين', dialCode: '+63', flag: '🇵🇭', priority: 100 },
  { code: 'PL', nameEn: 'Poland', nameAr: 'بولندا', dialCode: '+48', flag: '🇵🇱', priority: 100 },
  { code: 'PT', nameEn: 'Portugal', nameAr: 'البرتغال', dialCode: '+351', flag: '🇵🇹', priority: 100 },
  { code: 'PR', nameEn: 'Puerto Rico', nameAr: 'بورتوريكو', dialCode: '+1787', flag: '🇵🇷', priority: 100 },
  { code: 'RO', nameEn: 'Romania', nameAr: 'رومانيا', dialCode: '+40', flag: '🇷🇴', priority: 100 },
  { code: 'RU', nameEn: 'Russia', nameAr: 'روسيا', dialCode: '+7', flag: '🇷🇺', priority: 100 },
  { code: 'RW', nameEn: 'Rwanda', nameAr: 'رواندا', dialCode: '+250', flag: '🇷🇼', priority: 100 },
  { code: 'WS', nameEn: 'Samoa', nameAr: 'ساموا', dialCode: '+685', flag: '🇼🇸', priority: 100 },
  { code: 'SM', nameEn: 'San Marino', nameAr: 'سان مارينو', dialCode: '+378', flag: '🇸🇲', priority: 100 },
  { code: 'SN', nameEn: 'Senegal', nameAr: 'السنغال', dialCode: '+221', flag: '🇸🇳', priority: 100 },
  { code: 'RS', nameEn: 'Serbia', nameAr: 'صربيا', dialCode: '+381', flag: '🇷🇸', priority: 100 },
  { code: 'SC', nameEn: 'Seychelles', nameAr: 'سيشل', dialCode: '+248', flag: '🇸🇨', priority: 100 },
  { code: 'SL', nameEn: 'Sierra Leone', nameAr: 'سيراليون', dialCode: '+232', flag: '🇸🇱', priority: 100 },
  { code: 'SG', nameEn: 'Singapore', nameAr: 'سنغافورة', dialCode: '+65', flag: '🇸🇬', priority: 100 },
  { code: 'SK', nameEn: 'Slovakia', nameAr: 'سلوفاكيا', dialCode: '+421', flag: '🇸🇰', priority: 100 },
  { code: 'SI', nameEn: 'Slovenia', nameAr: 'سلوفينيا', dialCode: '+386', flag: '🇸🇮', priority: 100 },
  { code: 'ZA', nameEn: 'South Africa', nameAr: 'جنوب أفريقيا', dialCode: '+27', flag: '🇿🇦', priority: 100 },
  { code: 'SS', nameEn: 'South Sudan', nameAr: 'جنوب السودان', dialCode: '+211', flag: '🇸🇸', priority: 100 },
  { code: 'ES', nameEn: 'Spain', nameAr: 'إسبانيا', dialCode: '+34', flag: '🇪🇸', priority: 100 },
  { code: 'LK', nameEn: 'Sri Lanka', nameAr: 'سريلانكا', dialCode: '+94', flag: '🇱🇰', priority: 100 },
  { code: 'SR', nameEn: 'Suriname', nameAr: 'سورينام', dialCode: '+597', flag: '🇸🇷', priority: 100 },
  { code: 'SE', nameEn: 'Sweden', nameAr: 'السويد', dialCode: '+46', flag: '🇸🇪', priority: 100 },
  { code: 'CH', nameEn: 'Switzerland', nameAr: 'سويسرا', dialCode: '+41', flag: '🇨🇭', priority: 100 },
  { code: 'TW', nameEn: 'Taiwan', nameAr: 'تايوان', dialCode: '+886', flag: '🇹🇼', priority: 100 },
  { code: 'TJ', nameEn: 'Tajikistan', nameAr: 'طاجيكستان', dialCode: '+992', flag: '🇹🇯', priority: 100 },
  { code: 'TZ', nameEn: 'Tanzania', nameAr: 'تنزانيا', dialCode: '+255', flag: '🇹🇿', priority: 100 },
  { code: 'TH', nameEn: 'Thailand', nameAr: 'تايلاند', dialCode: '+66', flag: '🇹🇭', priority: 100 },
  { code: 'TL', nameEn: 'Timor-Leste', nameAr: 'تيمور الشرقية', dialCode: '+670', flag: '🇹🇱', priority: 100 },
  { code: 'TG', nameEn: 'Togo', nameAr: 'توغو', dialCode: '+228', flag: '🇹🇬', priority: 100 },
  { code: 'TT', nameEn: 'Trinidad and Tobago', nameAr: 'ترينيداد وتوباغو', dialCode: '+1868', flag: '🇹🇹', priority: 100 },
  { code: 'TR', nameEn: 'Turkey', nameAr: 'تركيا', dialCode: '+90', flag: '🇹🇷', priority: 100 },
  { code: 'TM', nameEn: 'Turkmenistan', nameAr: 'تركمانستان', dialCode: '+993', flag: '🇹🇲', priority: 100 },
  { code: 'UG', nameEn: 'Uganda', nameAr: 'أوغندا', dialCode: '+256', flag: '🇺🇬', priority: 100 },
  { code: 'UA', nameEn: 'Ukraine', nameAr: 'أوكرانيا', dialCode: '+380', flag: '🇺🇦', priority: 100 },
  { code: 'GB', nameEn: 'United Kingdom', nameAr: 'المملكة المتحدة', dialCode: '+44', flag: '🇬🇧', priority: 100 },
  { code: 'US', nameEn: 'United States', nameAr: 'الولايات المتحدة', dialCode: '+1', flag: '🇺🇸', priority: 100 },
  { code: 'UY', nameEn: 'Uruguay', nameAr: 'أوروغواي', dialCode: '+598', flag: '🇺🇾', priority: 100 },
  { code: 'UZ', nameEn: 'Uzbekistan', nameAr: 'أوزبكستان', dialCode: '+998', flag: '🇺🇿', priority: 100 },
  { code: 'VU', nameEn: 'Vanuatu', nameAr: 'فانواتو', dialCode: '+678', flag: '🇻🇺', priority: 100 },
  { code: 'VE', nameEn: 'Venezuela', nameAr: 'فنزويلا', dialCode: '+58', flag: '🇻🇪', priority: 100 },
  { code: 'VN', nameEn: 'Vietnam', nameAr: 'فيتنام', dialCode: '+84', flag: '🇻🇳', priority: 100 },
  { code: 'ZM', nameEn: 'Zambia', nameAr: 'زامبيا', dialCode: '+260', flag: '🇿🇲', priority: 100 },
  { code: 'ZW', nameEn: 'Zimbabwe', nameAr: 'زيمبابوي', dialCode: '+263', flag: '🇿🇼', priority: 100 },
];

// Combine all countries and sort by priority
export const countries: Country[] = [
  ...gulfCountries,
  ...arabCountries,
  ...otherCountries,
].sort((a, b) => (a.priority || 100) - (b.priority || 100));

// Default country (Saudi Arabia)
export const defaultCountry = countries[0];

// Get country by code
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

// Get country by dial code
export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return countries.find(c => c.dialCode === dialCode);
};

// Search countries
export const searchCountries = (query: string): Country[] => {
  const lowerQuery = query.toLowerCase();
  return countries.filter(c =>
    c.nameEn.toLowerCase().includes(lowerQuery) ||
    c.nameAr.includes(query) ||
    c.dialCode.includes(query) ||
    c.code.toLowerCase().includes(lowerQuery)
  );
};

// Format phone number for display
export const formatPhoneDisplay = (dialCode: string, phone: string): string => {
  return `${dialCode} ${phone}`;
};

// Parse full phone number into dial code and number
export const parsePhoneNumber = (fullPhone: string): { dialCode: string; number: string } => {
  // Try to find matching country by dial code
  for (const country of countries) {
    if (fullPhone.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        number: fullPhone.substring(country.dialCode.length).trim(),
      };
    }
  }

  // Default to Saudi Arabia if no match
  return {
    dialCode: defaultCountry.dialCode,
    number: fullPhone.replace(/^\+/, ''),
  };
};
