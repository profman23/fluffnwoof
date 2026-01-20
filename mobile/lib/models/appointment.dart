import 'pet.dart';

class Appointment {
  final String id;
  final String petId;
  final String? vetId;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String visitType;
  final String status;
  final bool isConfirmed;
  final int duration;
  final String? notes;
  final Pet? pet;
  final String? vetName;

  Appointment({
    required this.id,
    required this.petId,
    this.vetId,
    required this.appointmentDate,
    required this.appointmentTime,
    required this.visitType,
    required this.status,
    required this.isConfirmed,
    required this.duration,
    this.notes,
    this.pet,
    this.vetName,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] ?? '',
      petId: json['petId'] ?? '',
      vetId: json['vetId'],
      appointmentDate: DateTime.parse(json['appointmentDate']),
      appointmentTime: json['appointmentTime'] ?? '',
      visitType: json['visitType'] ?? 'GENERAL_CHECKUP',
      status: json['status'] ?? 'SCHEDULED',
      isConfirmed: json['isConfirmed'] ?? false,
      duration: json['duration'] ?? 30,
      notes: json['notes'],
      pet: json['pet'] != null ? Pet.fromJson(json['pet']) : null,
      vetName: json['vet'] != null
          ? '${json['vet']['firstName']} ${json['vet']['lastName']}'
          : null,
    );
  }

  String get visitTypeDisplay {
    switch (visitType) {
      case 'GENERAL_CHECKUP':
        return 'General Checkup';
      case 'GROOMING':
        return 'Grooming';
      case 'SURGERY':
        return 'Surgery';
      case 'VACCINATION':
        return 'Vaccination';
      case 'EMERGENCY':
        return 'Emergency';
      default:
        return visitType;
    }
  }

  String get statusDisplay {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'CHECK_IN':
        return 'Checked In';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
