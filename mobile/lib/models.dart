import 'package:flutter/foundation.dart';

class User {
  final String id;
  final String username;
  final String fullName;
  final String role;
  
  User({required this.id, required this.username, required this.fullName, required this.role});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      fullName: json['full_name'],
      role: json['role'],
    );
  }
}

class Machine {
  final String id;
  final String code;
  final String name;
  final String? model;
  final String? serialNo;
  final String? location;
  final String status;
  final DateTime? lastZaprafkaEnd;
  final int zaprafkaIntervalMonths;

  Machine({
    required this.id, required this.code, required this.name, this.model, this.serialNo, 
    this.location, required this.status, this.lastZaprafkaEnd, required this.zaprafkaIntervalMonths
  });

  factory Machine.fromJson(Map<String, dynamic> json) {
    return Machine(
      id: json['id'],
      code: json['code'],
      name: json['name'],
      model: json['model'],
      serialNo: json['serial_no'],
      location: json['location'],
      status: json['status'],
      lastZaprafkaEnd: json['last_zaprafka_end'] != null ? DateTime.parse(json['last_zaprafka_end']) : null,
      zaprafkaIntervalMonths: json['zaprafka_interval_months'] ?? 60,
    );
  }
}

class MaterialItem {
  final String id;
  final String code;
  final String name;
  final String? unit;

  MaterialItem({required this.id, required this.code, required this.name, this.unit});

  factory MaterialItem.fromJson(Map<String, dynamic> json) {
    return MaterialItem(
      id: json['id'],
      code: json['code'],
      name: json['name'],
      unit: json['unit'],
    );
  }
}

class RepairItem {
  final String? id;
  final int itemNo;
  final String? materialId;
  final String? freeTextMaterial;
  final String condition;
  final double qty;
  final String? unit;
  final double? unitPrice;
  final double? amount;
  final String? note;

  RepairItem({
    this.id, required this.itemNo, this.materialId, this.freeTextMaterial,
    required this.condition, required this.qty, this.unit, this.unitPrice, this.amount, this.note
  });

  factory RepairItem.fromJson(Map<String, dynamic> json) {
    return RepairItem(
      id: json['id'],
      itemNo: json['item_no'] ?? 0,
      materialId: json['material_id'],
      freeTextMaterial: json['free_text_material'],
      condition: json['condition'],
      qty: (json['qty'] ?? 0).toDouble(),
      unit: json['unit'],
      unitPrice: json['unit_price'] != null ? (json['unit_price'] as num).toDouble() : null,
      amount: json['amount'] != null ? (json['amount'] as num).toDouble() : null,
      note: json['note'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'item_no': itemNo,
      if (materialId != null) 'material_id': materialId,
      if (freeTextMaterial != null) 'free_text_material': freeTextMaterial,
      'condition': condition,
      'qty': qty,
      if (unit != null) 'unit': unit,
      if (note != null) 'note': note,
    };
  }
}

class Repair {
  final String? id;
  final String machineId;
  final DateTime repairDate;
  final String type;
  final String? title;
  final String? description;
  final String? crew;
  final String? zaprafkaId;
  final String? planId;
  final String? status;
  final List<RepairItem> items;

  Repair({
    this.id, required this.machineId, required this.repairDate, required this.type,
    this.title, this.description, this.crew, this.zaprafkaId, this.planId, this.status, required this.items
  });

  factory Repair.fromJson(Map<String, dynamic> json) {
    return Repair(
      id: json['id'],
      machineId: json['machine_id'],
      repairDate: DateTime.parse(json['repair_date']),
      type: json['type'],
      title: json['title'],
      description: json['description'],
      crew: json['crew'],
      zaprafkaId: json['zaprafka_id'],
      planId: json['plan_id'],
      status: json['status'],
      items: (json['items'] as List?)?.map((e) => RepairItem.fromJson(e)).toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'machine_id': machineId,
      'repair_date': repairDate.toIso8601String(),
      'type': type,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (crew != null) 'crew': crew,
      if (zaprafkaId != null) 'zaprafka_id': zaprafkaId,
      if (planId != null) 'plan_id': planId,
      'items': items.map((e) => e.toJson()).toList(),
    };
  }
}

class Plan {
  final String? id;
  final String machineId;
  final String type;
  final DateTime planDate;
  final String? description;
  final String? status;

  Plan({this.id, required this.machineId, required this.type, required this.planDate, this.description, this.status});

  factory Plan.fromJson(Map<String, dynamic> json) {
    return Plan(
      id: json['id'],
      machineId: json['machine_id'],
      type: json['type'],
      planDate: DateTime.parse(json['plan_date']),
      description: json['description'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'machine_id': machineId,
      'type': type,
      'plan_date': planDate.toIso8601String(),
      if (description != null) 'description': description,
    };
  }
}

class Zaprafka {
  final String? id;
  final String machineId;
  final DateTime startDate;
  final DateTime? endDate;
  final String? templateId;
  final String? note;
  final String? status;

  Zaprafka({this.id, required this.machineId, required this.startDate, this.endDate, this.templateId, this.note, this.status});

  factory Zaprafka.fromJson(Map<String, dynamic> json) {
    return Zaprafka(
      id: json['id'],
      machineId: json['machine_id'],
      startDate: DateTime.parse(json['start_date']),
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      templateId: json['template_id'],
      note: json['note'],
      status: json['status'],
    );
  }
}

class TemplateItem {
  final String? id;
  final String? materialId;
  final String condition;
  final double qty;
  final String? unit;
  final String? note;

  TemplateItem({this.id, this.materialId, required this.condition, required this.qty, this.unit, this.note});

  factory TemplateItem.fromJson(Map<String, dynamic> json) {
    return TemplateItem(
      id: json['id'],
      materialId: json['material_id'],
      condition: json['condition'],
      qty: (json['qty'] ?? 0).toDouble(),
      unit: json['unit'],
      note: json['note'],
    );
  }
}

class Template {
  final String id;
  final String name;
  final String type;
  final bool isActive;
  // backend might not return items inside list but let's assume it does if we fetch details
  final List<TemplateItem> items;

  Template({required this.id, required this.name, required this.type, required this.isActive, this.items = const []});

  factory Template.fromJson(Map<String, dynamic> json) {
    return Template(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      isActive: json['is_active'] ?? true,
      items: (json['items'] as List?)?.map((e) => TemplateItem.fromJson(e)).toList() ?? [],
    );
  }
}

class AuditLog {
  final String id;
  final String userId;
  final String action;
  final String resourceType;
  final String? resourceId;
  final String? details;
  final DateTime createdAt;

  AuditLog({
    required this.id, required this.userId, required this.action, 
    required this.resourceType, this.resourceId, this.details, required this.createdAt
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    return AuditLog(
      id: json['id'],
      userId: json['user_id'],
      action: json['action'],
      resourceType: json['resource_type'],
      resourceId: json['resource_id'],
      details: json['details'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }
}
