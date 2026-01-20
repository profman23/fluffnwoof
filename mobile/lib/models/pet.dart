class Pet {
  final String id;
  final String name;
  final String species;
  final String? breed;
  final DateTime? dateOfBirth;
  final String? gender;
  final double? weight;
  final String? color;
  final String? microchipNumber;
  final String? notes;

  Pet({
    required this.id,
    required this.name,
    required this.species,
    this.breed,
    this.dateOfBirth,
    this.gender,
    this.weight,
    this.color,
    this.microchipNumber,
    this.notes,
  });

  factory Pet.fromJson(Map<String, dynamic> json) {
    return Pet(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      species: json['species'] ?? '',
      breed: json['breed'],
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.tryParse(json['dateOfBirth'])
          : null,
      gender: json['gender'],
      weight: json['weight']?.toDouble(),
      color: json['color'],
      microchipNumber: json['microchipNumber'],
      notes: json['notes'],
    );
  }

  String get speciesEmoji {
    switch (species.toUpperCase()) {
      case 'DOG':
        return '🐕';
      case 'CAT':
        return '🐈';
      case 'BIRD':
        return '🦜';
      case 'RABBIT':
        return '🐇';
      case 'HAMSTER':
        return '🐹';
      case 'TURTLE':
        return '🐢';
      case 'FISH':
        return '🐟';
      default:
        return '🐾';
    }
  }

  String get speciesDisplay {
    switch (species.toUpperCase()) {
      case 'DOG':
        return 'Dog';
      case 'CAT':
        return 'Cat';
      case 'BIRD':
        return 'Bird';
      case 'RABBIT':
        return 'Rabbit';
      case 'HAMSTER':
        return 'Hamster';
      case 'TURTLE':
        return 'Turtle';
      case 'FISH':
        return 'Fish';
      default:
        return 'Other';
    }
  }

  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    int years = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      years--;
    }
    return years > 0 ? years : null;
  }
}
