import { Species } from '../types';

export interface Breed {
  value: string;
  labelEn: string;
  labelAr: string;
}

export const breedsBySpecies: Record<string, Breed[]> = {
  DOG: [
    { value: 'golden_retriever', labelEn: 'Golden Retriever', labelAr: 'جولدن ريتريفر' },
    { value: 'german_shepherd', labelEn: 'German Shepherd', labelAr: 'الراعي الألماني' },
    { value: 'labrador', labelEn: 'Labrador Retriever', labelAr: 'لابرادور ريتريفر' },
    { value: 'husky', labelEn: 'Siberian Husky', labelAr: 'هاسكي سيبيري' },
    { value: 'bulldog', labelEn: 'Bulldog', labelAr: 'بولدوج' },
    { value: 'poodle', labelEn: 'Poodle', labelAr: 'بودل' },
    { value: 'rottweiler', labelEn: 'Rottweiler', labelAr: 'روت وايلر' },
    { value: 'beagle', labelEn: 'Beagle', labelAr: 'بيجل' },
    { value: 'boxer', labelEn: 'Boxer', labelAr: 'بوكسر' },
    { value: 'dachshund', labelEn: 'Dachshund', labelAr: 'داشهند' },
    { value: 'shih_tzu', labelEn: 'Shih Tzu', labelAr: 'شيه تزو' },
    { value: 'yorkshire', labelEn: 'Yorkshire Terrier', labelAr: 'يوركشاير تيرير' },
    { value: 'chihuahua', labelEn: 'Chihuahua', labelAr: 'تشيواوا' },
    { value: 'maltese', labelEn: 'Maltese', labelAr: 'مالتيز' },
    { value: 'pomeranian', labelEn: 'Pomeranian', labelAr: 'بومرانيان' },
    { value: 'saluki', labelEn: 'Saluki', labelAr: 'سلوقي' },
    { value: 'doberman', labelEn: 'Doberman', labelAr: 'دوبرمان' },
    { value: 'great_dane', labelEn: 'Great Dane', labelAr: 'الدنماركي العظيم' },
    { value: 'cocker_spaniel', labelEn: 'Cocker Spaniel', labelAr: 'كوكر سبانيل' },
    { value: 'french_bulldog', labelEn: 'French Bulldog', labelAr: 'بولدوج فرنسي' },
    { value: 'mixed_dog', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_dog', labelEn: 'Other', labelAr: 'أخرى' },
  ],
  CAT: [
    { value: 'persian', labelEn: 'Persian', labelAr: 'شيرازي / فارسي' },
    { value: 'siamese', labelEn: 'Siamese', labelAr: 'سيامي' },
    { value: 'maine_coon', labelEn: 'Maine Coon', labelAr: 'مين كون' },
    { value: 'british_shorthair', labelEn: 'British Shorthair', labelAr: 'بريطاني قصير الشعر' },
    { value: 'ragdoll', labelEn: 'Ragdoll', labelAr: 'راغدول' },
    { value: 'scottish_fold', labelEn: 'Scottish Fold', labelAr: 'سكوتش فولد' },
    { value: 'bengal', labelEn: 'Bengal', labelAr: 'بنغالي' },
    { value: 'sphynx', labelEn: 'Sphynx', labelAr: 'سفينكس' },
    { value: 'abyssinian', labelEn: 'Abyssinian', labelAr: 'حبشي' },
    { value: 'russian_blue', labelEn: 'Russian Blue', labelAr: 'روسي أزرق' },
    { value: 'himalayan', labelEn: 'Himalayan', labelAr: 'هيمالايان' },
    { value: 'turkish_angora', labelEn: 'Turkish Angora', labelAr: 'أنغورا تركي' },
    { value: 'mixed_cat', labelEn: 'Mixed Breed', labelAr: 'سلالة مختلطة' },
    { value: 'other_cat', labelEn: 'Other', labelAr: 'أخرى' },
  ],
  BIRD: [
    { value: 'budgerigar', labelEn: 'Budgerigar (Budgie)', labelAr: 'ببغاء الدرة' },
    { value: 'cockatiel', labelEn: 'Cockatiel', labelAr: 'كوكاتيل' },
    { value: 'lovebird', labelEn: 'Lovebird', labelAr: 'طائر الحب' },
    { value: 'parrot', labelEn: 'Parrot', labelAr: 'ببغاء' },
    { value: 'canary', labelEn: 'Canary', labelAr: 'كناري' },
    { value: 'finch', labelEn: 'Finch', labelAr: 'عصفور الفينش' },
    { value: 'macaw', labelEn: 'Macaw', labelAr: 'مكاو' },
    { value: 'african_grey', labelEn: 'African Grey', labelAr: 'الببغاء الرمادي الأفريقي' },
    { value: 'cockatoo', labelEn: 'Cockatoo', labelAr: 'كوكاتو' },
    { value: 'other_bird', labelEn: 'Other', labelAr: 'أخرى' },
  ],
  OTHER: [],
};

/**
 * Get breed label based on language
 */
export const getBreedLabel = (breed: Breed, isRtl: boolean): string => {
  return isRtl ? breed.labelAr : breed.labelEn;
};

/**
 * Get breeds for a specific species
 */
export const getBreedsBySpecies = (species: Species | string): Breed[] => {
  return breedsBySpecies[species] || [];
};

/**
 * Find breed by value
 */
export const findBreedByValue = (species: Species | string, value: string): Breed | undefined => {
  const breeds = getBreedsBySpecies(species);
  return breeds.find((b) => b.value === value);
};

/**
 * Get breed display name
 */
export const getBreedDisplayName = (
  species: Species | string,
  breedValue: string,
  isRtl: boolean
): string => {
  const breed = findBreedByValue(species, breedValue);
  if (breed) {
    return getBreedLabel(breed, isRtl);
  }
  // If breed not found in list, return the value as-is (for custom/free-text breeds)
  return breedValue;
};
