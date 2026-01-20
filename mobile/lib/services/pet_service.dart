import '../models/pet.dart';
import 'api_service.dart';

class PetService {
  final ApiService _api = ApiService();

  Future<List<Pet>> getMyPets() async {
    final response = await _api.get('/pets/my-pets');
    final List<dynamic> data = response['data'] ?? [];
    return data.map((json) => Pet.fromJson(json)).toList();
  }

  Future<Pet> getPet(String id) async {
    final response = await _api.get('/pets/$id');
    return Pet.fromJson(response);
  }

  Future<Pet> createPet({
    required String name,
    required String species,
    String? breed,
    DateTime? dateOfBirth,
    String? gender,
    double? weight,
    String? color,
    String? notes,
  }) async {
    final response = await _api.post('/pets', {
      'name': name,
      'species': species,
      if (breed != null) 'breed': breed,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth.toIso8601String(),
      if (gender != null) 'gender': gender,
      if (weight != null) 'weight': weight,
      if (color != null) 'color': color,
      if (notes != null) 'notes': notes,
    });
    return Pet.fromJson(response);
  }
}
