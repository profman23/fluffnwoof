import 'pet.dart';

class MedicalRecord {
  final String id;
  final String petId;
  final String visitType;
  final DateTime visitDate;
  final String? chiefComplaint;
  final String? subjective;
  final String? objective;
  final String? assessment;
  final String? plan;
  final String? diagnosis;
  final String? treatment;
  final String? notes;
  final String? vetName;
  final Pet? pet;

  MedicalRecord({
    required this.id,
    required this.petId,
    required this.visitType,
    required this.visitDate,
    this.chiefComplaint,
    this.subjective,
    this.objective,
    this.assessment,
    this.plan,
    this.diagnosis,
    this.treatment,
    this.notes,
    this.vetName,
    this.pet,
  });

  factory MedicalRecord.fromJson(Map<String, dynamic> json) {
    return MedicalRecord(
      id: json['id'] ?? '',
      petId: json['petId'] ?? '',
      visitType: json['visitType'] ?? 'GENERAL_CHECKUP',
      visitDate: DateTime.parse(json['visitDate'] ?? json['createdAt']),
      chiefComplaint: json['chiefComplaint'],
      subjective: json['subjective'],
      objective: json['objective'],
      assessment: json['assessment'],
      plan: json['plan'],
      diagnosis: json['diagnosis'],
      treatment: json['treatment'],
      notes: json['notes'],
      vetName: json['vet'] != null
          ? '${json['vet']['firstName']} ${json['vet']['lastName']}'
          : null,
      pet: json['pet'] != null ? Pet.fromJson(json['pet']) : null,
    );
  }

  String get visitTypeDisplay {
    switch (visitType.toUpperCase()) {
      case 'GENERAL_CHECKUP':
        return 'General Checkup';
      case 'VACCINATION':
        return 'Vaccination';
      case 'GROOMING':
        return 'Grooming';
      case 'SURGERY':
        return 'Surgery';
      case 'EMERGENCY':
        return 'Emergency';
      default:
        return visitType;
    }
  }
}
