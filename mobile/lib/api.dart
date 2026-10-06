import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'models.dart';

class AuthProvider extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  late final Dio dio;
  
  String? _token;
  User? _currentUser;
  String _baseUrl = 'http://10.0.2.2:8000';

  bool get isAuthenticated => _token != null;
  User? get currentUser => _currentUser;
  bool get isAdmin => _currentUser?.role == 'ADMIN';
  String get baseUrl => _baseUrl;

  AuthProvider() {
    dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 5),
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        options.baseUrl = _baseUrl;
        final token = await _storage.read(key: 'token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 && _token != null) {
          await logout();
        }
        return handler.next(e);
      }
    ));
    _init();
  }

  Future<void> _init() async {
    final savedUrl = await _storage.read(key: 'server_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      _baseUrl = savedUrl;
    }
    _token = await _storage.read(key: 'token');
    if (_token != null) {
      try {
        await _fetchMe();
      } catch (e) {
        // Token might be invalid
      }
    }
    notifyListeners();
  }

  Future<void> setBaseUrl(String url) async {
    _baseUrl = url;
    await _storage.write(key: 'server_url', value: url);
    notifyListeners();
  }

  Future<void> _fetchMe() async {
    final response = await dio.get('/api/v1/auth/me');
    _currentUser = User.fromJson(response.data);
  }

  Future<void> login(String username, String password) async {
    try {
      final response = await dio.post('/api/v1/auth/login', 
        data: FormData.fromMap({'username': username, 'password': password})
      );
      _token = response.data['access_token'];
      await _storage.write(key: 'token', value: _token);
      await _fetchMe();
      notifyListeners();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('auth_failed');
      }
      throw Exception('server_error');
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    await _storage.delete(key: 'token');
    notifyListeners();
  }

  // --- MACHINES ---
  Future<List<Machine>> getMachines() async {
    final res = await dio.get('/api/v1/machines');
    return (res.data as List).map((e) => Machine.fromJson(e)).toList();
  }

  Future<Machine> getMachine(String code) async {
    final res = await dio.get('/api/v1/machines/$code');
    return Machine.fromJson(res.data);
  }

  // --- REPAIRS ---
  Future<List<Repair>> getRepairs({String? machineCode, String? dateFrom, String? dateTo, String? type, String? zaprId}) async {
    final query = <String, dynamic>{};
    if (machineCode != null) query['machine_code'] = machineCode;
    if (dateFrom != null) query['date_from'] = dateFrom;
    if (dateTo != null) query['date_to'] = dateTo;
    if (type != null) query['type'] = type;
    if (zaprId != null) query['zapr_id'] = zaprId;

    final res = await dio.get('/api/v1/repairs', queryParameters: query);
    return (res.data as List).map((e) => Repair.fromJson(e)).toList();
  }

  Future<void> addRepair(Repair repair) async {
    await dio.post('/api/v1/repairs', data: repair.toJson());
  }

  // --- PLANS ---
  Future<List<Plan>> getPlans({String? machineCode, String? dateFrom, String? dateTo, String? status}) async {
    final query = <String, dynamic>{};
    if (machineCode != null) query['machine_code'] = machineCode;
    if (dateFrom != null) query['date_from'] = dateFrom;
    if (dateTo != null) query['date_to'] = dateTo;
    if (status != null) query['status'] = status;

    final res = await dio.get('/api/v1/plans', queryParameters: query);
    return (res.data as List).map((e) => Plan.fromJson(e)).toList();
  }

  Future<void> addPlan(Plan plan) async {
    await dio.post('/api/v1/plans', data: plan.toJson());
  }

  Future<void> completePlan(String planId) async {
    await dio.post('/api/v1/plans/$planId/complete');
  }

  // --- ZAPRAFKA ---
  Future<List<Zaprafka>> getZaprafkas({String? machineCode}) async {
    final query = <String, dynamic>{};
    if (machineCode != null) query['machine_code'] = machineCode;
    final res = await dio.get('/api/v1/zaprafka', queryParameters: query);
    return (res.data as List).map((e) => Zaprafka.fromJson(e)).toList();
  }

  Future<void> startZaprafka(String machineId, String startDate, String? templateId, String? note) async {
    await dio.post('/api/v1/zaprafka/start', data: {
      'machine_id': machineId,
      'start_date': startDate,
      if (templateId != null) 'template_id': templateId,
      if (note != null) 'note': note,
    });
  }

  Future<void> finishZaprafka(String id, String endDate) async {
    await dio.post('/api/v1/zaprafka/$id/finish', queryParameters: {'end_date': endDate});
  }

  // --- MATERIALS ---
  Future<List<MaterialItem>> getMaterials({String? search, int page = 1}) async {
    final res = await dio.get('/api/v1/materials', queryParameters: {
      if (search != null) 'search': search,
      'page': page,
    });
    return (res.data as List).map((e) => MaterialItem.fromJson(e)).toList();
  }

  // --- TEMPLATES ---
  Future<List<Template>> getTemplates() async {
    final res = await dio.get('/api/v1/templates');
    return (res.data as List).map((e) => Template.fromJson(e)).toList();
  }

  Future<Template> getTemplate(String id) async {
    final res = await dio.get('/api/v1/templates/$id');
    return Template.fromJson(res.data);
  }
  // --- ADMIN (USERS) ---
  Future<List<User>> getUsers() async {
    final res = await dio.get('/api/v1/users');
    return (res.data as List).map((e) => User.fromJson(e)).toList();
  }

  Future<void> createUser(Map<String, dynamic> data) async {
    await dio.post('/api/v1/users', data: data);
  }

  Future<void> updateUser(String id, Map<String, dynamic> data) async {
    await dio.put('/api/v1/users/$id', data: data);
  }

  // --- ADMIN (MACHINES) ---
  Future<void> createMachine(Map<String, dynamic> data) async {
    await dio.post('/api/v1/machines', data: data);
  }

  Future<void> updateMachine(String id, Map<String, dynamic> data) async {
    await dio.put('/api/v1/machines/$id', data: data);
  }

  // --- ADMIN (AUDIT LOGS) ---
  Future<List<AuditLog>> getAuditLogs() async {
    final res = await dio.get('/api/v1/audit-log');
    return (res.data as List).map((e) => AuditLog.fromJson(e)).toList();
  }
}
