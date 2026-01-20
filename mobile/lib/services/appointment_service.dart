import '../models/appointment.dart';
import 'api_service.dart';

class AppointmentService {
  final ApiService _api = ApiService();

  Future<List<Appointment>> getMyAppointments() async {
    final response = await _api.get('/appointments/my-appointments');
    final List<dynamic> data = response['data'] ?? [];
    return data.map((json) => Appointment.fromJson(json)).toList();
  }

  Future<List<Appointment>> getUpcomingAppointments() async {
    final appointments = await getMyAppointments();
    final now = DateTime.now();
    return appointments
        .where((apt) =>
            apt.appointmentDate.isAfter(now) && apt.status != 'CANCELLED')
        .toList()
      ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
  }

  Future<Appointment> createAppointment({
    required String petId,
    required DateTime appointmentDate,
    required String appointmentTime,
    required String visitType,
    String? vetId,
    String? notes,
  }) async {
    final response = await _api.post('/appointments', {
      'petId': petId,
      'appointmentDate': appointmentDate.toIso8601String().split('T')[0],
      'appointmentTime': appointmentTime,
      'visitType': visitType,
      if (vetId != null) 'vetId': vetId,
      if (notes != null) 'notes': notes,
    });
    return Appointment.fromJson(response);
  }

  Future<void> cancelAppointment(String id) async {
    await _api.put('/appointments/$id/cancel', {});
  }

  Future<List<Map<String, dynamic>>> getAvailableVets() async {
    final response = await _api.get('/staff?role=vet');
    return List<Map<String, dynamic>>.from(response['data'] ?? []);
  }
}
