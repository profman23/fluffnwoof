import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/pet.dart';
import '../services/pet_service.dart';

class PetsScreen extends StatefulWidget {
  const PetsScreen({super.key});

  @override
  State<PetsScreen> createState() => _PetsScreenState();
}

class _PetsScreenState extends State<PetsScreen> {
  final PetService _petService = PetService();
  List<Pet> _pets = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  Future<void> _loadPets() async {
    setState(() => _isLoading = true);
    try {
      final pets = await _petService.getMyPets();
      setState(() {
        _pets = pets;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading pets: $e')),
        );
      }
    }
  }

  void _showAddPetDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: _AddPetForm(
          onPetAdded: () {
            Navigator.pop(context);
            _loadPets();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Pets'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddPetDialog,
        icon: const Icon(Icons.add),
        label: const Text('Add Pet'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadPets,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _pets.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _pets.length,
                    itemBuilder: (context, index) {
                      return _PetCard(pet: _pets[index]);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.pets, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No pets registered',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _showAddPetDialog,
            icon: const Icon(Icons.add),
            label: const Text('Add Your First Pet'),
          ),
        ],
      ),
    );
  }
}

class _PetCard extends StatelessWidget {
  final Pet pet;

  const _PetCard({required this.pet});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: Text(
                  pet.speciesEmoji,
                  style: const TextStyle(fontSize: 32),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pet.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    pet.speciesDisplay,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  if (pet.breed != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      pet.breed!,
                      style: TextStyle(color: Colors.grey[500], fontSize: 13),
                    ),
                  ],
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (pet.age != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.secondaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${pet.age} yrs',
                      style: const TextStyle(
                        color: AppTheme.secondaryColor,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                if (pet.weight != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${pet.weight} kg',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddPetForm extends StatefulWidget {
  final VoidCallback onPetAdded;

  const _AddPetForm({required this.onPetAdded});

  @override
  State<_AddPetForm> createState() => _AddPetFormState();
}

class _AddPetFormState extends State<_AddPetForm> {
  final _formKey = GlobalKey<FormState>();
  final PetService _petService = PetService();

  final _nameController = TextEditingController();
  final _breedController = TextEditingController();
  final _weightController = TextEditingController();

  String _selectedSpecies = 'DOG';
  String _selectedGender = 'MALE';
  DateTime? _birthDate;
  bool _isSubmitting = false;

  final List<Map<String, String>> _species = [
    {'value': 'DOG', 'label': 'Dog', 'emoji': '🐕'},
    {'value': 'CAT', 'label': 'Cat', 'emoji': '🐈'},
    {'value': 'BIRD', 'label': 'Bird', 'emoji': '🦜'},
    {'value': 'RABBIT', 'label': 'Rabbit', 'emoji': '🐰'},
    {'value': 'HAMSTER', 'label': 'Hamster', 'emoji': '🐹'},
    {'value': 'TURTLE', 'label': 'Turtle', 'emoji': '🐢'},
    {'value': 'FISH', 'label': 'Fish', 'emoji': '🐠'},
    {'value': 'OTHER', 'label': 'Other', 'emoji': '🐾'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _breedController.dispose();
    _weightController.dispose();
    super.dispose();
  }

  Future<void> _selectBirthDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime.now().subtract(const Duration(days: 365)),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _birthDate = picked);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      await _petService.createPet(
        name: _nameController.text,
        species: _selectedSpecies,
        breed: _breedController.text.isNotEmpty ? _breedController.text : null,
        gender: _selectedGender,
        dateOfBirth: _birthDate,
        weight: _weightController.text.isNotEmpty
            ? double.tryParse(_weightController.text)
            : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Pet added successfully!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        widget.onPetAdded();
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Add New Pet',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),

            // Name
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Pet Name *',
                prefixIcon: Icon(Icons.pets),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter pet name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Species
            const Text(
              'Species *',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _species.map((s) {
                final isSelected = _selectedSpecies == s['value'];
                return GestureDetector(
                  onTap: () => setState(() => _selectedSpecies = s['value']!),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryColor.withValues(alpha: 0.1)
                          : Colors.grey[100],
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : Colors.grey[300]!,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(s['emoji']!),
                        const SizedBox(width: 4),
                        Text(
                          s['label']!,
                          style: TextStyle(
                            color: isSelected
                                ? AppTheme.primaryColor
                                : Colors.black87,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Gender
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedGender = 'MALE'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _selectedGender == 'MALE'
                            ? Colors.blue.withValues(alpha: 0.1)
                            : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedGender == 'MALE'
                              ? Colors.blue
                              : Colors.grey[300]!,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.male,
                            color: _selectedGender == 'MALE'
                                ? Colors.blue
                                : Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Male',
                            style: TextStyle(
                              color: _selectedGender == 'MALE'
                                  ? Colors.blue
                                  : Colors.grey[700],
                              fontWeight: _selectedGender == 'MALE'
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedGender = 'FEMALE'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _selectedGender == 'FEMALE'
                            ? Colors.pink.withValues(alpha: 0.1)
                            : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _selectedGender == 'FEMALE'
                              ? Colors.pink
                              : Colors.grey[300]!,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.female,
                            color: _selectedGender == 'FEMALE'
                                ? Colors.pink
                                : Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Female',
                            style: TextStyle(
                              color: _selectedGender == 'FEMALE'
                                  ? Colors.pink
                                  : Colors.grey[700],
                              fontWeight: _selectedGender == 'FEMALE'
                                  ? FontWeight.bold
                                  : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Breed
            TextFormField(
              controller: _breedController,
              decoration: const InputDecoration(
                labelText: 'Breed (Optional)',
                prefixIcon: Icon(Icons.category),
              ),
            ),
            const SizedBox(height: 16),

            // Birth Date & Weight
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: _selectBirthDate,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Birth Date',
                        prefixIcon: Icon(Icons.cake),
                      ),
                      child: Text(
                        _birthDate != null
                            ? '${_birthDate!.day}/${_birthDate!.month}/${_birthDate!.year}'
                            : 'Select date',
                        style: TextStyle(
                          color: _birthDate != null
                              ? Colors.black87
                              : Colors.grey[500],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _weightController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Weight (kg)',
                      prefixIcon: Icon(Icons.monitor_weight),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Add Pet', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
