import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/pet.dart';
import '../services/pet_service.dart';
import '../services/appointment_service.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final PetService _petService = PetService();
  final AppointmentService _appointmentService = AppointmentService();

  List<Pet> _pets = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  Pet? _selectedPet;
  String? _selectedVisitType;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTime;
  final TextEditingController _notesController = TextEditingController();

  final List<Map<String, String>> _visitTypes = [
    {'value': 'GENERAL_CHECKUP', 'label': 'فحص عام', 'labelEn': 'General Checkup'},
    {'value': 'VACCINATION', 'label': 'تطعيم', 'labelEn': 'Vaccination'},
    {'value': 'GROOMING', 'label': 'تجميل', 'labelEn': 'Grooming'},
    {'value': 'SURGERY', 'label': 'جراحة', 'labelEn': 'Surgery'},
    {'value': 'EMERGENCY', 'label': 'طوارئ', 'labelEn': 'Emergency'},
  ];

  final List<String> _availableTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00',
  ];

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadPets() async {
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

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _submitAppointment() async {
    if (_selectedPet == null || _selectedVisitType == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _appointmentService.createAppointment(
        petId: _selectedPet!.id,
        visitType: _selectedVisitType!,
        appointmentDate: _selectedDate,
        appointmentTime: _selectedTime!,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Appointment booked successfully!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        Navigator.of(context).pop();
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _pets.isEmpty
              ? _buildNoPetsMessage()
              : _buildForm(),
    );
  }

  Widget _buildNoPetsMessage() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.pets, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No pets registered',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'Please add a pet before booking an appointment',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[500]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Pet Selection
          _buildSectionTitle('Select Pet'),
          const SizedBox(height: 8),
          _buildPetSelector(),
          const SizedBox(height: 24),

          // Visit Type
          _buildSectionTitle('Visit Type'),
          const SizedBox(height: 8),
          _buildVisitTypeSelector(),
          const SizedBox(height: 24),

          // Date Selection
          _buildSectionTitle('Date'),
          const SizedBox(height: 8),
          _buildDateSelector(),
          const SizedBox(height: 24),

          // Time Selection
          _buildSectionTitle('Time'),
          const SizedBox(height: 8),
          _buildTimeSelector(),
          const SizedBox(height: 24),

          // Notes
          _buildSectionTitle('Notes (Optional)'),
          const SizedBox(height: 8),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Add any notes or special requests...',
            ),
          ),
          const SizedBox(height: 32),

          // Submit Button
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitAppointment,
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
                : const Text('Book Appointment', style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildPetSelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _pets.map((pet) {
        final isSelected = _selectedPet?.id == pet.id;
        return GestureDetector(
          onTap: () => setState(() => _selectedPet = pet),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor.withValues(alpha: 0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(pet.speciesEmoji, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 8),
                Text(
                  pet.name,
                  style: TextStyle(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? AppTheme.primaryColor : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildVisitTypeSelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _visitTypes.map((type) {
        final isSelected = _selectedVisitType == type['value'];
        return GestureDetector(
          onTap: () => setState(() => _selectedVisitType = type['value']),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor.withValues(alpha: 0.1)
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Text(
              type['labelEn']!,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : Colors.black87,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDateSelector() {
    return GestureDetector(
      onTap: _selectDate,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today, color: AppTheme.primaryColor),
            const SizedBox(width: 12),
            Text(
              '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
              style: const TextStyle(fontSize: 16),
            ),
            const Spacer(),
            Icon(Icons.arrow_drop_down, color: Colors.grey[600]),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeSelector() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _availableTimes.map((time) {
        final isSelected = _selectedTime == time;
        return GestureDetector(
          onTap: () => setState(() => _selectedTime = time),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryColor
                  : Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? AppTheme.primaryColor : Colors.grey[300]!,
              ),
            ),
            child: Text(
              time,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
