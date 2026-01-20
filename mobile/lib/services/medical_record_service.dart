import '../models/medical_record.dart';
import 'api_service.dart';

class MedicalRecordService {
  final ApiService _api = ApiService();

  Future<List<MedicalRecord>> getMyMedicalRecords() async {
    final response = await _api.get('/medical-records/my-records');
    final List<dynamic> data = response['data'] ?? [];
    return data.map((json) => MedicalRecord.fromJson(json)).toList();
  }

  Future<List<MedicalRecord>> getPetMedicalRecords(String petId) async {
    final response = await _api.get('/medical-records/pet/$petId');
    final List<dynamic> data = response['data'] ?? [];
    return data.map((json) => MedicalRecord.fromJson(json)).toList();
  }

  Future<MedicalRecord> getMedicalRecord(String id) async {
    final response = await _api.get('/medical-records/$id');
    return MedicalRecord.fromJson(response);
  }
}
