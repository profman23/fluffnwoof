import { Species } from '../types';

// ============================================
// Species Data with Icons
// ============================================

export interface SpeciesInfo {
  value: Species;
  labelEn: string;
  labelAr: string;
  icon: string;
}

export const speciesList: SpeciesInfo[] = [
  // Common Pets
  { value: Species.DOG, labelEn: 'Dog', labelAr: 'كلب', icon: '🐕' },
  { value: Species.CAT, labelEn: 'Cat', labelAr: 'قطة', icon: '🐈' },
  { value: Species.BIRD, labelEn: 'Bird', labelAr: 'طائر', icon: '🦜' },
  { value: Species.RABBIT, labelEn: 'Rabbit', labelAr: 'أرنب', icon: '🐇' },
  { value: Species.HAMSTER, labelEn: 'Hamster', labelAr: 'هامستر', icon: '🐹' },
  { value: Species.GUINEA_PIG, labelEn: 'Guinea Pig', labelAr: 'خنزير غينيا', icon: '🐹' },
  { value: Species.TURTLE, labelEn: 'Turtle/Tortoise', labelAr: 'سلحفاة', icon: '🐢' },
  { value: Species.FISH, labelEn: 'Fish', labelAr: 'سمكة', icon: '🐟' },

  // Exotic Pets
  { value: Species.MONKEY, labelEn: 'Monkey', labelAr: 'قرد', icon: '🐒' },
  { value: Species.FERRET, labelEn: 'Ferret', labelAr: 'فيريت', icon: '🦦' },
  { value: Species.HEDGEHOG, labelEn: 'Hedgehog', labelAr: 'قنفذ', icon: '🦔' },
  { value: Species.SNAKE, labelEn: 'Snake', labelAr: 'ثعبان', icon: '🐍' },
  { value: Species.LIZARD, labelEn: 'Lizard', labelAr: 'سحلية', icon: '🦎' },
  { value: Species.FROG, labelEn: 'Frog', labelAr: 'ضفدع', icon: '🐸' },

  // Farm Animals
  { value: Species.HORSE, labelEn: 'Horse', labelAr: 'حصان', icon: '🐴' },
  { value: Species.GOAT, labelEn: 'Goat', labelAr: 'ماعز', icon: '🐐' },
  { value: Species.SHEEP, labelEn: 'Sheep', labelAr: 'خروف', icon: '🐑' },
  { value: Species.COW, labelEn: 'Cow', labelAr: 'بقرة', icon: '🐄' },
  { value: Species.CAMEL, labelEn: 'Camel', labelAr: 'جمل', icon: '🐪' },
  { value: Species.DONKEY, labelEn: 'Donkey', labelAr: 'حمار', icon: '🫏' },
  { value: Species.PIG, labelEn: 'Pig', labelAr: 'خنزير', icon: '🐷' },
  { value: Species.ALPACA, labelEn: 'Alpaca/Llama', labelAr: 'ألباكا / لاما', icon: '🦙' },

  // Poultry
  { value: Species.CHICKEN, labelEn: 'Chicken', labelAr: 'دجاجة', icon: '🐔' },
  { value: Species.DUCK, labelEn: 'Duck', labelAr: 'بطة', icon: '🦆' },

  // Other
  { value: Species.OTHER, labelEn: 'Other', labelAr: 'أخرى', icon: '🐾' },
];

export const getSpeciesInfo = (species: Species | string): SpeciesInfo | undefined => {
  return speciesList.find(s => s.value === species);
};

export const getSpeciesIcon = (species: Species | string): string => {
  return getSpeciesInfo(species)?.icon || '🐾';
};

export const getSpeciesLabel = (species: Species | string, isRtl: boolean): string => {
  const info = getSpeciesInfo(species);
  return info ? (isRtl ? info.labelAr : info.labelEn) : species;
};

// ============================================
// Breed Data by Species
// ============================================

export interface Breed {
  value: string;
  labelEn: string;
  labelAr: string;
}

export const breedsBySpecies: Record<string, Breed[]> = {
  // ==================== DOGS ====================
  DOG: [
    // Retrievers & Sporting Dogs
    { value: 'golden_retriever', labelEn: 'Golden Retriever', labelAr: 'جولدن ريتريفر' },
    { value: 'labrador', labelEn: 'Labrador Retriever', labelAr: 'لابرادور ريتريفر' },
    { value: 'cocker_spaniel', labelEn: 'Cocker Spaniel', labelAr: 'كوكر سبانيل' },
    { value: 'english_springer', labelEn: 'English Springer Spaniel', labelAr: 'سبرينجر سبانيل إنجليزي' },

    // Shepherds & Working Dogs
    { value: 'german_shepherd', labelEn: 'German Shepherd', labelAr: 'الراعي الألماني' },
    { value: 'belgian_malinois', labelEn: 'Belgian Malinois', labelAr: 'مالينوا بلجيكي' },
    { value: 'australian_shepherd', labelEn: 'Australian Shepherd', labelAr: 'الراعي الأسترالي' },
    { value: 'border_collie', labelEn: 'Border Collie', labelAr: 'بوردر كولي' },

    // Northern Breeds
    { value: 'husky', labelEn: 'Siberian Husky', labelAr: 'هاسكي سيبيري' },
    { value: 'alaskan_malamute', labelEn: 'Alaskan Malamute', labelAr: 'ملموت ألاسكا' },
    { value: 'samoyed', labelEn: 'Samoyed', labelAr: 'سامويد' },
    { value: 'akita', labelEn: 'Akita', labelAr: 'أكيتا' },
    { value: 'shiba_inu', labelEn: 'Shiba Inu', labelAr: 'شيبا إينو' },

    // Bulldogs & Terriers
    { value: 'bulldog', labelEn: 'English Bulldog', labelAr: 'بولدوج إنجليزي' },
    { value: 'french_bulldog', labelEn: 'French Bulldog', labelAr: 'بولدوج فرنسي' },
    { value: 'american_bully', labelEn: 'American Bully', labelAr: 'أمريكان بولي' },
    { value: 'pitbull', labelEn: 'American Pit Bull Terrier', labelAr: 'بيتبول أمريكي' },
    { value: 'bull_terrier', labelEn: 'Bull Terrier', labelAr: 'بول تيرير' },
    { value: 'boston_terrier', labelEn: 'Boston Terrier', labelAr: 'بوسطن تيرير' },

    // Guard Dogs
    { value: 'rottweiler', labelEn: 'Rottweiler', labelAr: 'روت وايلر' },
    { value: 'doberman', labelEn: 'Doberman Pinscher', labelAr: 'دوبرمان' },
    { value: 'boxer', labelEn: 'Boxer', labelAr: 'بوكسر' },
    { value: 'cane_corso', labelEn: 'Cane Corso', labelAr: 'كاني كورسو' },
    { value: 'great_dane', labelEn: 'Great Dane', labelAr: 'الدنماركي العظيم' },
    { value: 'mastiff', labelEn: 'Mastiff', labelAr: 'ماستيف' },

    // Small Dogs
    { value: 'poodle', labelEn: 'Poodle', labelAr: 'بودل' },
    { value: 'toy_poodle', labelEn: 'Toy Poodle', labelAr: 'بودل توي' },
    { value: 'miniature_poodle', labelEn: 'Miniature Poodle', labelAr: 'بودل مصغر' },
    { value: 'bichon_frise', labelEn: 'Bichon Frise', labelAr: 'بيشون فريز' },
    { value: 'maltese', labelEn: 'Maltese', labelAr: 'مالتيز' },
    { value: 'shih_tzu', labelEn: 'Shih Tzu', labelAr: 'شيه تزو' },
    { value: 'yorkshire', labelEn: 'Yorkshire Terrier', labelAr: 'يوركشاير تيرير' },
    { value: 'chihuahua', labelEn: 'Chihuahua', labelAr: 'تشيواوا' },
    { value: 'pomeranian', labelEn: 'Pomeranian', labelAr: 'بومرانيان' },
    { value: 'pug', labelEn: 'Pug', labelAr: 'بج' },
    { value: 'cavalier', labelEn: 'Cavalier King Charles Spaniel', labelAr: 'كافالير كينج تشارلز' },
    { value: 'papillon', labelEn: 'Papillon', labelAr: 'بابيلون' },

    // Hounds
    { value: 'beagle', labelEn: 'Beagle', labelAr: 'بيجل' },
    { value: 'dachshund', labelEn: 'Dachshund', labelAr: 'داشهند' },
    { value: 'basset_hound', labelEn: 'Basset Hound', labelAr: 'باسيت هاوند' },
    { value: 'greyhound', labelEn: 'Greyhound', labelAr: 'جريهاوند' },
    { value: 'saluki', labelEn: 'Saluki', labelAr: 'سلوقي' },
    { value: 'afghan_hound', labelEn: 'Afghan Hound', labelAr: 'كلب أفغاني' },

    // Mixed & Other
    { value: 'goldendoodle', labelEn: 'Goldendoodle', labelAr: 'جولدن دودل' },
    { value: 'labradoodle', labelEn: 'Labradoodle', labelAr: 'لابرادودل' },
    { value: 'cockapoo', labelEn: 'Cockapoo', labelAr: 'كوكابو' },
    { value: 'mixed_dog', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_dog', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== CATS ====================
  CAT: [
    // Long Hair
    { value: 'persian', labelEn: 'Persian', labelAr: 'شيرازي / فارسي' },
    { value: 'himalayan', labelEn: 'Himalayan', labelAr: 'هيمالايان' },
    { value: 'maine_coon', labelEn: 'Maine Coon', labelAr: 'مين كون' },
    { value: 'ragdoll', labelEn: 'Ragdoll', labelAr: 'راغدول' },
    { value: 'norwegian_forest', labelEn: 'Norwegian Forest', labelAr: 'غابة نرويجي' },
    { value: 'turkish_angora', labelEn: 'Turkish Angora', labelAr: 'أنغورا تركي' },
    { value: 'birman', labelEn: 'Birman', labelAr: 'بيرمان' },

    // Short Hair
    { value: 'british_shorthair', labelEn: 'British Shorthair', labelAr: 'بريطاني قصير الشعر' },
    { value: 'american_shorthair', labelEn: 'American Shorthair', labelAr: 'أمريكي قصير الشعر' },
    { value: 'siamese', labelEn: 'Siamese', labelAr: 'سيامي' },
    { value: 'russian_blue', labelEn: 'Russian Blue', labelAr: 'روسي أزرق' },
    { value: 'abyssinian', labelEn: 'Abyssinian', labelAr: 'حبشي' },
    { value: 'burmese', labelEn: 'Burmese', labelAr: 'بورمي' },

    // Unique Breeds
    { value: 'scottish_fold', labelEn: 'Scottish Fold', labelAr: 'سكوتش فولد' },
    { value: 'bengal', labelEn: 'Bengal', labelAr: 'بنغالي' },
    { value: 'sphynx', labelEn: 'Sphynx', labelAr: 'سفينكس' },
    { value: 'devon_rex', labelEn: 'Devon Rex', labelAr: 'ديفون ريكس' },
    { value: 'munchkin', labelEn: 'Munchkin', labelAr: 'مونتشكين' },
    { value: 'exotic_shorthair', labelEn: 'Exotic Shorthair', labelAr: 'إكزوتيك شورتهير' },
    { value: 'oriental', labelEn: 'Oriental', labelAr: 'أورينتال' },
    { value: 'somali', labelEn: 'Somali', labelAr: 'صومالي' },

    // Mixed & Other
    { value: 'mixed_cat', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_cat', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== BIRDS ====================
  BIRD: [
    // Parakeets & Small Birds
    { value: 'budgerigar', labelEn: 'Budgerigar (Budgie)', labelAr: 'ببغاء الدرة' },
    { value: 'cockatiel', labelEn: 'Cockatiel', labelAr: 'كوكاتيل' },
    { value: 'lovebird', labelEn: 'Lovebird', labelAr: 'طائر الحب' },
    { value: 'canary', labelEn: 'Canary', labelAr: 'كناري' },
    { value: 'finch', labelEn: 'Finch', labelAr: 'فينش' },
    { value: 'zebra_finch', labelEn: 'Zebra Finch', labelAr: 'فينش زيبرا' },

    // Parrots
    { value: 'african_grey', labelEn: 'African Grey Parrot', labelAr: 'ببغاء رمادي أفريقي' },
    { value: 'amazon_parrot', labelEn: 'Amazon Parrot', labelAr: 'ببغاء أمازون' },
    { value: 'eclectus', labelEn: 'Eclectus Parrot', labelAr: 'ببغاء إكليكتوس' },
    { value: 'indian_ringneck', labelEn: 'Indian Ringneck', labelAr: 'الدرة الهندية' },
    { value: 'alexandrine', labelEn: 'Alexandrine Parakeet', labelAr: 'ببغاء إسكندراني' },
    { value: 'quaker', labelEn: 'Quaker Parrot', labelAr: 'ببغاء كويكر' },
    { value: 'senegal', labelEn: 'Senegal Parrot', labelAr: 'ببغاء سنغالي' },

    // Cockatoos & Macaws
    { value: 'cockatoo', labelEn: 'Cockatoo', labelAr: 'كوكاتو' },
    { value: 'umbrella_cockatoo', labelEn: 'Umbrella Cockatoo', labelAr: 'كوكاتو أمبريلا' },
    { value: 'macaw', labelEn: 'Macaw', labelAr: 'مكاو' },
    { value: 'blue_gold_macaw', labelEn: 'Blue & Gold Macaw', labelAr: 'مكاو أزرق وذهبي' },
    { value: 'scarlet_macaw', labelEn: 'Scarlet Macaw', labelAr: 'مكاو قرمزي' },

    // Conures
    { value: 'sun_conure', labelEn: 'Sun Conure', labelAr: 'كونيور الشمس' },
    { value: 'green_cheek_conure', labelEn: 'Green Cheek Conure', labelAr: 'كونيور أخضر الخد' },

    // Other Birds
    { value: 'pigeon', labelEn: 'Pigeon', labelAr: 'حمام' },
    { value: 'dove', labelEn: 'Dove', labelAr: 'يمام' },
    { value: 'other_bird', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== RABBITS ====================
  RABBIT: [
    { value: 'holland_lop', labelEn: 'Holland Lop', labelAr: 'هولاند لوب' },
    { value: 'mini_lop', labelEn: 'Mini Lop', labelAr: 'ميني لوب' },
    { value: 'french_lop', labelEn: 'French Lop', labelAr: 'فرنش لوب' },
    { value: 'english_lop', labelEn: 'English Lop', labelAr: 'إنجلش لوب' },
    { value: 'netherland_dwarf', labelEn: 'Netherland Dwarf', labelAr: 'قزم هولندي' },
    { value: 'lionhead', labelEn: 'Lionhead', labelAr: 'رأس الأسد' },
    { value: 'rex', labelEn: 'Rex Rabbit', labelAr: 'أرنب ريكس' },
    { value: 'mini_rex', labelEn: 'Mini Rex', labelAr: 'ميني ريكس' },
    { value: 'flemish_giant', labelEn: 'Flemish Giant', labelAr: 'العملاق الفلمنكي' },
    { value: 'angora', labelEn: 'Angora Rabbit', labelAr: 'أرنب أنغورا' },
    { value: 'dutch', labelEn: 'Dutch Rabbit', labelAr: 'أرنب هولندي' },
    { value: 'californian', labelEn: 'Californian', labelAr: 'كاليفورني' },
    { value: 'new_zealand', labelEn: 'New Zealand', labelAr: 'نيوزيلندي' },
    { value: 'harlequin', labelEn: 'Harlequin', labelAr: 'هارليكوين' },
    { value: 'mixed_rabbit', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_rabbit', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== HAMSTERS ====================
  HAMSTER: [
    { value: 'syrian', labelEn: 'Syrian Hamster', labelAr: 'هامستر سوري' },
    { value: 'dwarf_campbell', labelEn: "Campbell's Dwarf", labelAr: 'قزم كامبل' },
    { value: 'dwarf_winter_white', labelEn: 'Winter White Dwarf', labelAr: 'قزم أبيض شتوي' },
    { value: 'roborovski', labelEn: 'Roborovski Dwarf', labelAr: 'روبوروفسكي القزم' },
    { value: 'chinese', labelEn: 'Chinese Hamster', labelAr: 'هامستر صيني' },
    { value: 'teddy_bear', labelEn: 'Teddy Bear Hamster', labelAr: 'هامستر الدبدوب' },
    { value: 'other_hamster', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== GUINEA PIGS ====================
  GUINEA_PIG: [
    { value: 'american', labelEn: 'American (Short Hair)', labelAr: 'أمريكي (قصير الشعر)' },
    { value: 'abyssinian', labelEn: 'Abyssinian', labelAr: 'حبشي' },
    { value: 'peruvian', labelEn: 'Peruvian', labelAr: 'بيروفي' },
    { value: 'silkie', labelEn: 'Silkie', labelAr: 'سيلكي' },
    { value: 'texel', labelEn: 'Texel', labelAr: 'تيكسل' },
    { value: 'teddy', labelEn: 'Teddy', labelAr: 'تيدي' },
    { value: 'skinny', labelEn: 'Skinny Pig', labelAr: 'سكيني بيج' },
    { value: 'coronet', labelEn: 'Coronet', labelAr: 'كورونت' },
    { value: 'sheltie', labelEn: 'Sheltie', labelAr: 'شيلتي' },
    { value: 'other_guinea_pig', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== TURTLES & TORTOISES ====================
  TURTLE: [
    // Aquatic Turtles
    { value: 'red_eared_slider', labelEn: 'Red-Eared Slider', labelAr: 'سلحفاة الأذن الحمراء' },
    { value: 'painted_turtle', labelEn: 'Painted Turtle', labelAr: 'السلحفاة المطلية' },
    { value: 'map_turtle', labelEn: 'Map Turtle', labelAr: 'سلحفاة الخريطة' },
    { value: 'musk_turtle', labelEn: 'Musk Turtle', labelAr: 'سلحفاة المسك' },
    { value: 'softshell_turtle', labelEn: 'Softshell Turtle', labelAr: 'سلحفاة ناعمة الصدفة' },

    // Tortoises
    { value: 'sulcata', labelEn: 'Sulcata Tortoise', labelAr: 'سلحفاة سولكاتا' },
    { value: 'russian_tortoise', labelEn: 'Russian Tortoise', labelAr: 'سلحفاة روسية' },
    { value: 'greek_tortoise', labelEn: 'Greek Tortoise', labelAr: 'سلحفاة يونانية' },
    { value: 'hermann', labelEn: "Hermann's Tortoise", labelAr: 'سلحفاة هيرمان' },
    { value: 'leopard_tortoise', labelEn: 'Leopard Tortoise', labelAr: 'سلحفاة الفهد' },
    { value: 'indian_star', labelEn: 'Indian Star Tortoise', labelAr: 'سلحفاة النجمة الهندية' },
    { value: 'red_foot', labelEn: 'Red-Footed Tortoise', labelAr: 'سلحفاة القدم الحمراء' },

    // Box Turtles
    { value: 'eastern_box', labelEn: 'Eastern Box Turtle', labelAr: 'سلحفاة صندوقية شرقية' },
    { value: 'ornate_box', labelEn: 'Ornate Box Turtle', labelAr: 'سلحفاة صندوقية مزخرفة' },

    { value: 'other_turtle', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== FISH ====================
  FISH: [
    // Freshwater - Tropical
    { value: 'betta', labelEn: 'Betta (Siamese Fighting)', labelAr: 'سمكة البيتا' },
    { value: 'goldfish', labelEn: 'Goldfish', labelAr: 'السمكة الذهبية' },
    { value: 'guppy', labelEn: 'Guppy', labelAr: 'جوبي' },
    { value: 'molly', labelEn: 'Molly', labelAr: 'مولي' },
    { value: 'platy', labelEn: 'Platy', labelAr: 'بلاتي' },
    { value: 'swordtail', labelEn: 'Swordtail', labelAr: 'ذيل السيف' },
    { value: 'neon_tetra', labelEn: 'Neon Tetra', labelAr: 'نيون تيترا' },
    { value: 'angelfish', labelEn: 'Angelfish', labelAr: 'سمكة الملاك' },
    { value: 'discus', labelEn: 'Discus', labelAr: 'ديسكس' },
    { value: 'oscar', labelEn: 'Oscar', labelAr: 'أوسكار' },
    { value: 'cichlid', labelEn: 'Cichlid', labelAr: 'سيكليد' },
    { value: 'arowana', labelEn: 'Arowana', labelAr: 'أروانا' },
    { value: 'flowerhorn', labelEn: 'Flowerhorn', labelAr: 'فلاور هورن' },

    // Catfish & Bottom Feeders
    { value: 'corydoras', labelEn: 'Corydoras Catfish', labelAr: 'كوريدوراس' },
    { value: 'pleco', labelEn: 'Plecostomus', labelAr: 'بليكو' },

    // Koi & Pond Fish
    { value: 'koi', labelEn: 'Koi', labelAr: 'كوي' },

    // Marine Fish
    { value: 'clownfish', labelEn: 'Clownfish', labelAr: 'سمكة المهرج' },
    { value: 'tang', labelEn: 'Tang', labelAr: 'تانج' },
    { value: 'damselfish', labelEn: 'Damselfish', labelAr: 'دامسل' },

    { value: 'other_fish', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== MONKEYS & PRIMATES ====================
  MONKEY: [
    // Small Monkeys
    { value: 'capuchin', labelEn: 'Capuchin Monkey', labelAr: 'قرد كابوشين' },
    { value: 'marmoset', labelEn: 'Marmoset', labelAr: 'مارموزيت' },
    { value: 'tamarin', labelEn: 'Tamarin', labelAr: 'تامرين' },
    { value: 'squirrel_monkey', labelEn: 'Squirrel Monkey', labelAr: 'قرد السنجاب' },
    { value: 'spider_monkey', labelEn: 'Spider Monkey', labelAr: 'قرد العنكبوت' },
    { value: 'howler_monkey', labelEn: 'Howler Monkey', labelAr: 'قرد العويل' },

    // Macaques
    { value: 'rhesus_macaque', labelEn: 'Rhesus Macaque', labelAr: 'مكاك ريسوسي' },
    { value: 'japanese_macaque', labelEn: 'Japanese Macaque', labelAr: 'مكاك ياباني' },
    { value: 'crab_eating_macaque', labelEn: 'Crab-eating Macaque', labelAr: 'مكاك آكل السلطعون' },

    // Others
    { value: 'vervet_monkey', labelEn: 'Vervet Monkey', labelAr: 'قرد فرفت' },
    { value: 'baboon', labelEn: 'Baboon', labelAr: 'قرد البابون' },
    { value: 'mandrill', labelEn: 'Mandrill', labelAr: 'ماندريل' },
    { value: 'lemur', labelEn: 'Lemur', labelAr: 'ليمور' },
    { value: 'other_monkey', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== HORSES ====================
  HORSE: [
    // Light Breeds
    { value: 'arabian', labelEn: 'Arabian', labelAr: 'عربي أصيل' },
    { value: 'thoroughbred', labelEn: 'Thoroughbred', labelAr: 'ثوروبريد' },
    { value: 'quarter_horse', labelEn: 'Quarter Horse', labelAr: 'كوارتر هورس' },
    { value: 'morgan', labelEn: 'Morgan', labelAr: 'مورجان' },
    { value: 'appaloosa', labelEn: 'Appaloosa', labelAr: 'أبالوسا' },
    { value: 'paint_horse', labelEn: 'Paint Horse', labelAr: 'بينت هورس' },
    { value: 'andalusian', labelEn: 'Andalusian', labelAr: 'أندلسي' },
    { value: 'akhal_teke', labelEn: 'Akhal-Teke', labelAr: 'أخال تيكي' },

    // Draft Breeds
    { value: 'clydesdale', labelEn: 'Clydesdale', labelAr: 'كلايدزديل' },
    { value: 'percheron', labelEn: 'Percheron', labelAr: 'بيرشيرون' },
    { value: 'belgian_draft', labelEn: 'Belgian Draft', labelAr: 'بلجيكي جر' },
    { value: 'shire', labelEn: 'Shire', labelAr: 'شاير' },

    // Ponies
    { value: 'shetland_pony', labelEn: 'Shetland Pony', labelAr: 'شتلاند بوني' },
    { value: 'welsh_pony', labelEn: 'Welsh Pony', labelAr: 'ويلز بوني' },
    { value: 'miniature_horse', labelEn: 'Miniature Horse', labelAr: 'حصان مصغر' },

    // Warmbloods
    { value: 'hanoverian', labelEn: 'Hanoverian', labelAr: 'هانوفيري' },
    { value: 'friesian', labelEn: 'Friesian', labelAr: 'فريزيان' },
    { value: 'lipizzan', labelEn: 'Lipizzan', labelAr: 'ليبيزان' },

    { value: 'mixed_horse', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_horse', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== GOATS ====================
  GOAT: [
    // Dairy Breeds
    { value: 'nubian', labelEn: 'Nubian', labelAr: 'نوبي' },
    { value: 'saanen', labelEn: 'Saanen', labelAr: 'ساينن' },
    { value: 'alpine', labelEn: 'Alpine', labelAr: 'ألباين' },
    { value: 'toggenburg', labelEn: 'Toggenburg', labelAr: 'توجنبرج' },
    { value: 'lamancha', labelEn: 'LaMancha', labelAr: 'لامانشا' },
    { value: 'oberhasli', labelEn: 'Oberhasli', labelAr: 'أوبرهاسلي' },

    // Meat Breeds
    { value: 'boer', labelEn: 'Boer', labelAr: 'بوير' },
    { value: 'kiko', labelEn: 'Kiko', labelAr: 'كيكو' },
    { value: 'spanish', labelEn: 'Spanish', labelAr: 'إسباني' },

    // Fiber Breeds
    { value: 'angora_goat', labelEn: 'Angora', labelAr: 'أنغورا' },
    { value: 'cashmere', labelEn: 'Cashmere', labelAr: 'كشمير' },

    // Miniature & Pet Breeds
    { value: 'nigerian_dwarf', labelEn: 'Nigerian Dwarf', labelAr: 'قزم نيجيري' },
    { value: 'pygmy', labelEn: 'Pygmy', labelAr: 'بيجمي' },

    // Local Breeds
    { value: 'damascus', labelEn: 'Damascus (Shami)', labelAr: 'شامي / دمشقي' },
    { value: 'baladi', labelEn: 'Baladi', labelAr: 'بلدي' },

    { value: 'mixed_goat', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_goat', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== SHEEP ====================
  SHEEP: [
    // Wool Breeds
    { value: 'merino', labelEn: 'Merino', labelAr: 'ميرينو' },
    { value: 'rambouillet', labelEn: 'Rambouillet', labelAr: 'رامبوييه' },
    { value: 'corriedale', labelEn: 'Corriedale', labelAr: 'كوريديل' },

    // Meat Breeds
    { value: 'suffolk', labelEn: 'Suffolk', labelAr: 'سوفولك' },
    { value: 'dorper', labelEn: 'Dorper', labelAr: 'دوربر' },
    { value: 'texel', labelEn: 'Texel', labelAr: 'تيكسل' },
    { value: 'hampshire', labelEn: 'Hampshire', labelAr: 'هامبشاير' },

    // Dual Purpose
    { value: 'dorset', labelEn: 'Dorset', labelAr: 'دورست' },
    { value: 'columbia', labelEn: 'Columbia', labelAr: 'كولومبيا' },

    // Hair Sheep
    { value: 'katahdin', labelEn: 'Katahdin', labelAr: 'كاتادين' },
    { value: 'barbados_blackbelly', labelEn: 'Barbados Blackbelly', labelAr: 'باربادوس أسود البطن' },

    // Local Breeds
    { value: 'awassi', labelEn: 'Awassi', labelAr: 'عواسي' },
    { value: 'najdi', labelEn: 'Najdi', labelAr: 'نجدي' },
    { value: 'baladi_sheep', labelEn: 'Baladi', labelAr: 'بلدي' },

    { value: 'mixed_sheep', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_sheep', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== COWS ====================
  COW: [
    // Dairy Breeds
    { value: 'holstein', labelEn: 'Holstein Friesian', labelAr: 'هولشتاين فريزيان' },
    { value: 'jersey', labelEn: 'Jersey', labelAr: 'جيرسي' },
    { value: 'guernsey', labelEn: 'Guernsey', labelAr: 'غيرنزي' },
    { value: 'brown_swiss', labelEn: 'Brown Swiss', labelAr: 'سويسري بني' },
    { value: 'ayrshire', labelEn: 'Ayrshire', labelAr: 'إيرشاير' },

    // Beef Breeds
    { value: 'angus', labelEn: 'Angus', labelAr: 'أنجس' },
    { value: 'hereford', labelEn: 'Hereford', labelAr: 'هيرفورد' },
    { value: 'charolais', labelEn: 'Charolais', labelAr: 'شاروليه' },
    { value: 'limousin', labelEn: 'Limousin', labelAr: 'ليموزين' },
    { value: 'simmental', labelEn: 'Simmental', labelAr: 'سيمنتال' },
    { value: 'brahman', labelEn: 'Brahman', labelAr: 'براهمان' },

    // Dual Purpose
    { value: 'shorthorn', labelEn: 'Shorthorn', labelAr: 'شورت هورن' },
    { value: 'devon', labelEn: 'Devon', labelAr: 'ديفون' },

    // Local Breeds
    { value: 'baladi_cow', labelEn: 'Baladi', labelAr: 'بلدي' },

    { value: 'mixed_cow', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_cow', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== CAMELS ====================
  CAMEL: [
    // Dromedary (One Hump)
    { value: 'dromedary', labelEn: 'Dromedary (Arabian)', labelAr: 'الجمل العربي (سنام واحد)' },
    { value: 'asil', labelEn: 'Asil', labelAr: 'أصيل' },
    { value: 'majaheem', labelEn: 'Majaheem', labelAr: 'مجاهيم' },
    { value: 'wadah', labelEn: 'Wadah', labelAr: 'وضح' },
    { value: 'safra', labelEn: 'Safra', labelAr: 'صفرا' },
    { value: 'hamra', labelEn: 'Hamra', labelAr: 'حمرا' },
    { value: 'shaal', labelEn: 'Shaal', labelAr: 'شعل' },

    // Bactrian (Two Humps)
    { value: 'bactrian', labelEn: 'Bactrian (Two Humps)', labelAr: 'الجمل ذو السنامين' },

    // Racing Camels
    { value: 'racing_camel', labelEn: 'Racing Camel', labelAr: 'جمل سباق' },

    { value: 'mixed_camel', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_camel', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== DONKEYS ====================
  DONKEY: [
    { value: 'standard_donkey', labelEn: 'Standard Donkey', labelAr: 'حمار عادي' },
    { value: 'miniature_donkey', labelEn: 'Miniature Donkey', labelAr: 'حمار مصغر' },
    { value: 'mammoth_donkey', labelEn: 'Mammoth Donkey', labelAr: 'حمار ماموث' },
    { value: 'poitou', labelEn: 'Poitou Donkey', labelAr: 'حمار بواتو' },
    { value: 'catalan', labelEn: 'Catalan Donkey', labelAr: 'حمار كاتالوني' },
    { value: 'andalusian_donkey', labelEn: 'Andalusian Donkey', labelAr: 'حمار أندلسي' },
    { value: 'baladi_donkey', labelEn: 'Baladi', labelAr: 'بلدي' },
    { value: 'mule', labelEn: 'Mule (Horse x Donkey)', labelAr: 'بغل' },
    { value: 'hinny', labelEn: 'Hinny (Donkey x Horse)', labelAr: 'نغل' },
    { value: 'other_donkey', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== FERRETS ====================
  FERRET: [
    { value: 'sable_ferret', labelEn: 'Sable', labelAr: 'سيبل' },
    { value: 'albino_ferret', labelEn: 'Albino', labelAr: 'ألبينو' },
    { value: 'black_sable', labelEn: 'Black Sable', labelAr: 'سيبل أسود' },
    { value: 'chocolate', labelEn: 'Chocolate', labelAr: 'شوكولاتة' },
    { value: 'cinnamon', labelEn: 'Cinnamon', labelAr: 'قرفة' },
    { value: 'champagne', labelEn: 'Champagne', labelAr: 'شامبين' },
    { value: 'silver_ferret', labelEn: 'Silver', labelAr: 'فضي' },
    { value: 'blaze_ferret', labelEn: 'Blaze', labelAr: 'بليز' },
    { value: 'panda_ferret', labelEn: 'Panda', labelAr: 'باندا' },
    { value: 'other_ferret', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== HEDGEHOGS ====================
  HEDGEHOG: [
    { value: 'african_pygmy', labelEn: 'African Pygmy', labelAr: 'قنفذ أفريقي قزم' },
    { value: 'algerian', labelEn: 'Algerian', labelAr: 'جزائري' },
    { value: 'egyptian_hedgehog', labelEn: 'Egyptian Long-eared', labelAr: 'قنفذ مصري طويل الأذن' },
    { value: 'european_hedgehog', labelEn: 'European', labelAr: 'أوروبي' },
    { value: 'indian_hedgehog', labelEn: 'Indian Long-eared', labelAr: 'هندي طويل الأذن' },
    { value: 'other_hedgehog', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== SNAKES ====================
  SNAKE: [
    // Pythons
    { value: 'ball_python', labelEn: 'Ball Python', labelAr: 'بايثون كرة' },
    { value: 'burmese_python', labelEn: 'Burmese Python', labelAr: 'بايثون بورمي' },
    { value: 'reticulated_python', labelEn: 'Reticulated Python', labelAr: 'بايثون شبكي' },
    { value: 'carpet_python', labelEn: 'Carpet Python', labelAr: 'بايثون السجاد' },
    { value: 'green_tree_python', labelEn: 'Green Tree Python', labelAr: 'بايثون الشجر الأخضر' },

    // Boas
    { value: 'boa_constrictor', labelEn: 'Boa Constrictor', labelAr: 'بواء عاصرة' },
    { value: 'red_tail_boa', labelEn: 'Red-Tail Boa', labelAr: 'بواء ذيل أحمر' },
    { value: 'rosy_boa', labelEn: 'Rosy Boa', labelAr: 'بواء وردية' },
    { value: 'rainbow_boa', labelEn: 'Rainbow Boa', labelAr: 'بواء قوس قزح' },

    // Colubrids
    { value: 'corn_snake', labelEn: 'Corn Snake', labelAr: 'ثعبان الذرة' },
    { value: 'king_snake', labelEn: 'King Snake', labelAr: 'ثعبان الملك' },
    { value: 'milk_snake', labelEn: 'Milk Snake', labelAr: 'ثعبان الحليب' },
    { value: 'rat_snake', labelEn: 'Rat Snake', labelAr: 'ثعبان الجرذ' },
    { value: 'garter_snake', labelEn: 'Garter Snake', labelAr: 'ثعبان الحدائق' },
    { value: 'hognose', labelEn: 'Hognose Snake', labelAr: 'ثعبان خنزيري الأنف' },

    { value: 'other_snake', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== LIZARDS ====================
  LIZARD: [
    // Geckos
    { value: 'leopard_gecko', labelEn: 'Leopard Gecko', labelAr: 'جيكو النمر' },
    { value: 'crested_gecko', labelEn: 'Crested Gecko', labelAr: 'جيكو ذو العرف' },
    { value: 'tokay_gecko', labelEn: 'Tokay Gecko', labelAr: 'جيكو توكاي' },
    { value: 'day_gecko', labelEn: 'Day Gecko', labelAr: 'جيكو النهار' },
    { value: 'gargoyle_gecko', labelEn: 'Gargoyle Gecko', labelAr: 'جيكو غرغول' },

    // Dragons
    { value: 'bearded_dragon', labelEn: 'Bearded Dragon', labelAr: 'التنين الملتحي' },
    { value: 'chinese_water_dragon', labelEn: 'Chinese Water Dragon', labelAr: 'تنين الماء الصيني' },
    { value: 'frilled_dragon', labelEn: 'Frilled Dragon', labelAr: 'التنين المكشكش' },

    // Iguanas
    { value: 'green_iguana', labelEn: 'Green Iguana', labelAr: 'إغوانا خضراء' },
    { value: 'blue_iguana', labelEn: 'Blue Iguana', labelAr: 'إغوانا زرقاء' },
    { value: 'desert_iguana', labelEn: 'Desert Iguana', labelAr: 'إغوانا صحراوية' },

    // Monitors
    { value: 'savannah_monitor', labelEn: 'Savannah Monitor', labelAr: 'ورل السافانا' },
    { value: 'nile_monitor', labelEn: 'Nile Monitor', labelAr: 'ورل النيل' },
    { value: 'ackie_monitor', labelEn: 'Ackie Monitor', labelAr: 'ورل أكي' },

    // Chameleons
    { value: 'veiled_chameleon', labelEn: 'Veiled Chameleon', labelAr: 'حرباء يمنية' },
    { value: 'panther_chameleon', labelEn: 'Panther Chameleon', labelAr: 'حرباء النمر' },
    { value: 'jacksons_chameleon', labelEn: "Jackson's Chameleon", labelAr: 'حرباء جاكسون' },

    // Skinks
    { value: 'blue_tongue_skink', labelEn: 'Blue Tongue Skink', labelAr: 'سحلية اللسان الأزرق' },
    { value: 'fire_skink', labelEn: 'Fire Skink', labelAr: 'سحلية النار' },

    // Others
    { value: 'uromastyx', labelEn: 'Uromastyx', labelAr: 'ضب' },
    { value: 'tegu', labelEn: 'Tegu', labelAr: 'تيجو' },

    { value: 'other_lizard', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== FROGS & AMPHIBIANS ====================
  FROG: [
    // Tree Frogs
    { value: 'red_eyed_tree_frog', labelEn: 'Red-Eyed Tree Frog', labelAr: 'ضفدع الشجر أحمر العين' },
    { value: 'whites_tree_frog', labelEn: "White's Tree Frog", labelAr: 'ضفدع الشجر الأبيض' },
    { value: 'green_tree_frog', labelEn: 'Green Tree Frog', labelAr: 'ضفدع الشجر الأخضر' },

    // Dart Frogs
    { value: 'poison_dart_frog', labelEn: 'Poison Dart Frog', labelAr: 'ضفدع السهم السام' },
    { value: 'blue_poison_dart', labelEn: 'Blue Poison Dart', labelAr: 'ضفدع السهم الأزرق' },

    // Toads
    { value: 'pacman_frog', labelEn: 'Pacman Frog', labelAr: 'ضفدع باكمان' },
    { value: 'african_bullfrog', labelEn: 'African Bullfrog', labelAr: 'ضفدع الثور الأفريقي' },
    { value: 'tomato_frog', labelEn: 'Tomato Frog', labelAr: 'ضفدع الطماطم' },
    { value: 'fire_bellied_toad', labelEn: 'Fire-Bellied Toad', labelAr: 'علجوم ناري البطن' },

    // Aquatic
    { value: 'african_dwarf_frog', labelEn: 'African Dwarf Frog', labelAr: 'ضفدع قزم أفريقي' },
    { value: 'african_clawed_frog', labelEn: 'African Clawed Frog', labelAr: 'ضفدع أفريقي مخالب' },
    { value: 'axolotl', labelEn: 'Axolotl', labelAr: 'أكسولوتل' },

    // Salamanders
    { value: 'fire_salamander', labelEn: 'Fire Salamander', labelAr: 'سمندل النار' },
    { value: 'tiger_salamander', labelEn: 'Tiger Salamander', labelAr: 'سمندل النمر' },
    { value: 'newt', labelEn: 'Newt', labelAr: 'سمندل مائي' },

    { value: 'other_frog', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== CHICKENS ====================
  CHICKEN: [
    // Egg Layers
    { value: 'leghorn', labelEn: 'Leghorn', labelAr: 'ليجهورن' },
    { value: 'rhode_island_red', labelEn: 'Rhode Island Red', labelAr: 'رود آيلاند الأحمر' },
    { value: 'sussex', labelEn: 'Sussex', labelAr: 'ساسكس' },
    { value: 'plymouth_rock', labelEn: 'Plymouth Rock', labelAr: 'بليموث روك' },
    { value: 'australorp', labelEn: 'Australorp', labelAr: 'أوسترالورب' },
    { value: 'isa_brown', labelEn: 'ISA Brown', labelAr: 'إيزا براون' },

    // Meat Breeds
    { value: 'cornish', labelEn: 'Cornish', labelAr: 'كورنيش' },
    { value: 'jersey_giant', labelEn: 'Jersey Giant', labelAr: 'جيرسي العملاق' },
    { value: 'brahma', labelEn: 'Brahma', labelAr: 'براهما' },
    { value: 'orpington', labelEn: 'Orpington', labelAr: 'أوربينجتون' },

    // Ornamental & Fancy
    { value: 'silkie', labelEn: 'Silkie', labelAr: 'سيلكي' },
    { value: 'polish', labelEn: 'Polish', labelAr: 'بولش' },
    { value: 'cochin', labelEn: 'Cochin', labelAr: 'كوشين' },
    { value: 'wyandotte', labelEn: 'Wyandotte', labelAr: 'وياندوت' },
    { value: 'serama', labelEn: 'Serama', labelAr: 'سيراما' },

    // Bantams
    { value: 'bantam', labelEn: 'Bantam', labelAr: 'بانتام' },

    // Local Breeds
    { value: 'baladi_chicken', labelEn: 'Baladi', labelAr: 'بلدي' },
    { value: 'fayoumi', labelEn: 'Fayoumi', labelAr: 'فيومي' },

    { value: 'mixed_chicken', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_chicken', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== DUCKS ====================
  DUCK: [
    // Domestic Ducks
    { value: 'pekin', labelEn: 'Pekin', labelAr: 'بكيني' },
    { value: 'khaki_campbell', labelEn: 'Khaki Campbell', labelAr: 'خاكي كامبل' },
    { value: 'indian_runner', labelEn: 'Indian Runner', labelAr: 'عداء هندي' },
    { value: 'rouen', labelEn: 'Rouen', labelAr: 'روان' },
    { value: 'muscovy', labelEn: 'Muscovy', labelAr: 'مسكوفي' },
    { value: 'cayuga', labelEn: 'Cayuga', labelAr: 'كايوجا' },
    { value: 'call_duck', labelEn: 'Call Duck', labelAr: 'بط النداء' },

    // Ornamental
    { value: 'mandarin', labelEn: 'Mandarin Duck', labelAr: 'بط ماندرين' },
    { value: 'wood_duck', labelEn: 'Wood Duck', labelAr: 'بط الخشب' },

    // Geese
    { value: 'toulouse_goose', labelEn: 'Toulouse Goose', labelAr: 'إوز تولوز' },
    { value: 'embden_goose', labelEn: 'Embden Goose', labelAr: 'إوز إمبدين' },
    { value: 'chinese_goose', labelEn: 'Chinese Goose', labelAr: 'إوز صيني' },
    { value: 'african_goose', labelEn: 'African Goose', labelAr: 'إوز أفريقي' },

    { value: 'mixed_duck', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_duck', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== PIGS ====================
  PIG: [
    // Domestic Pigs
    { value: 'yorkshire', labelEn: 'Yorkshire', labelAr: 'يوركشاير' },
    { value: 'duroc', labelEn: 'Duroc', labelAr: 'دوروك' },
    { value: 'hampshire_pig', labelEn: 'Hampshire', labelAr: 'هامبشاير' },
    { value: 'berkshire', labelEn: 'Berkshire', labelAr: 'بيركشاير' },
    { value: 'landrace', labelEn: 'Landrace', labelAr: 'لاندريس' },
    { value: 'poland_china', labelEn: 'Poland China', labelAr: 'بولاند تشاينا' },
    { value: 'chester_white', labelEn: 'Chester White', labelAr: 'تشستر وايت' },
    { value: 'spotted_pig', labelEn: 'Spotted', labelAr: 'مرقط' },

    // Mini Pigs
    { value: 'miniature_pig', labelEn: 'Miniature Pig', labelAr: 'خنزير مصغر' },
    { value: 'potbellied', labelEn: 'Potbellied Pig', labelAr: 'خنزير بطين' },
    { value: 'kunekune', labelEn: 'KuneKune', labelAr: 'كوني كوني' },
    { value: 'juliana', labelEn: 'Juliana', labelAr: 'جوليانا' },
    { value: 'gottingen', labelEn: 'Gottingen Mini', labelAr: 'جوتنجن المصغر' },
    { value: 'teacup_pig', labelEn: 'Teacup Pig', labelAr: 'خنزير فنجان' },

    // Wild Boars
    { value: 'wild_boar', labelEn: 'Wild Boar', labelAr: 'خنزير بري' },

    { value: 'mixed_pig', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_pig', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== ALPACAS & LLAMAS ====================
  ALPACA: [
    // Alpacas
    { value: 'huacaya', labelEn: 'Huacaya Alpaca', labelAr: 'ألباكا هواكايا' },
    { value: 'suri', labelEn: 'Suri Alpaca', labelAr: 'ألباكا سوري' },

    // Llamas
    { value: 'classic_llama', labelEn: 'Classic Llama', labelAr: 'لاما كلاسيك' },
    { value: 'wooly_llama', labelEn: 'Wooly Llama', labelAr: 'لاما صوفية' },
    { value: 'silky_llama', labelEn: 'Silky Llama', labelAr: 'لاما حريرية' },
    { value: 'suri_llama', labelEn: 'Suri Llama', labelAr: 'لاما سوري' },

    // Other Camelids
    { value: 'guanaco', labelEn: 'Guanaco', labelAr: 'جواناكو' },
    { value: 'vicuna', labelEn: 'Vicuna', labelAr: 'فيكونيا' },

    { value: 'mixed_alpaca', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_alpaca', labelEn: 'Other', labelAr: 'أخرى' },
  ],

  // ==================== OTHER ====================
  OTHER: [
    { value: 'chinchilla', labelEn: 'Chinchilla', labelAr: 'شنشيلا' },
    { value: 'sugar_glider', labelEn: 'Sugar Glider', labelAr: 'شوجر جلايدر' },
    { value: 'gerbil', labelEn: 'Gerbil', labelAr: 'جربيل' },
    { value: 'mouse', labelEn: 'Mouse', labelAr: 'فأر' },
    { value: 'rat', labelEn: 'Rat', labelAr: 'جرذ' },
    { value: 'degu', labelEn: 'Degu', labelAr: 'ديجو' },
    { value: 'prairie_dog', labelEn: 'Prairie Dog', labelAr: 'كلب البراري' },
    { value: 'hermit_crab', labelEn: 'Hermit Crab', labelAr: 'سرطان ناسك' },
    { value: 'scorpion', labelEn: 'Scorpion', labelAr: 'عقرب' },
    { value: 'tarantula', labelEn: 'Tarantula', labelAr: 'رتيلاء' },
    { value: 'praying_mantis', labelEn: 'Praying Mantis', labelAr: 'فرس النبي' },
    { value: 'stick_insect', labelEn: 'Stick Insect', labelAr: 'حشرة العصا' },
    { value: 'snail', labelEn: 'Giant Snail', labelAr: 'حلزون عملاق' },
    { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
  ],
};

// ============================================
// Helper Functions
// ============================================

export const getBreedLabel = (breed: Breed, isRtl: boolean): string => {
  return isRtl ? breed.labelAr : breed.labelEn;
};

export const getBreedsBySpecies = (species: Species | string): Breed[] => {
  return breedsBySpecies[species] || [];
};

export const findBreedByValue = (species: Species | string, value: string): Breed | undefined => {
  const breeds = getBreedsBySpecies(species);
  return breeds.find((b) => b.value === value);
};

export const getBreedDisplayName = (
  species: Species | string,
  breedValue: string,
  isRtl: boolean
): string => {
  const breed = findBreedByValue(species, breedValue);
  if (breed) {
    return getBreedLabel(breed, isRtl);
  }
  return breedValue;
};

// Search helpers for autocomplete
export const searchSpecies = (query: string, isRtl: boolean): SpeciesInfo[] => {
  const lowerQuery = query.toLowerCase();
  return speciesList.filter(s => {
    const label = isRtl ? s.labelAr : s.labelEn;
    return label.toLowerCase().includes(lowerQuery);
  });
};

export const searchBreeds = (species: Species | string, query: string, isRtl: boolean): Breed[] => {
  const breeds = getBreedsBySpecies(species);
  const lowerQuery = query.toLowerCase();
  return breeds.filter(b => {
    const label = isRtl ? b.labelAr : b.labelEn;
    return label.toLowerCase().includes(lowerQuery);
  });
};
