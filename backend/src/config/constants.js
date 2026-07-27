// CNS System Types - Make sure these match what's used in the seed
const SYSTEM_TYPES = {
  COMMUNICATION: 'communication',
  NAVIGATION: 'navigation',
  SURVEILLANCE: 'surveillance',
  DATA_PROCESSING: 'data_processing',
  METEOROLOGICAL: 'meteorological'
};

// Communication Subsystems
const COMMUNICATION_SUBSYSTEMS = [
  'vhf_radio', 'hf_radio', 'satcom', 'voip', 
  'intercom', 'telephone', 'gateway'
];

// Navigation Subsystems
const NAVIGATION_SUBSYSTEMS = [
  'vor', 'dme', 'ils', 'ndb', 'gps', 'gbas', 'tacan'
];

// Surveillance Subsystems
const SURVEILLANCE_SUBSYSTEMS = [
  'primary_radar', 'secondary_radar', 'ads_b', 
  'mlat', 'ssr', 'psr', 'mode_s'
];

// Data Processing Subsystems
const DATA_PROCESSING_SUBSYSTEMS = [
  'flight_data', 'fdp', 'aftn', 'amhs', 
  'atc_console', 'fdps', 'cns_monitoring'
];

// Meteorological Subsystems
const METEOROLOGICAL_SUBSYSTEMS = [
  'aws', 'awos', 'metar', 'wind_shear', 
  'ceilometer', 'weather_radar'
];

// System Status
const SYSTEM_STATUS = {
  OPERATIONAL: 'operational',
  MAINTENANCE: 'maintenance',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
  DECOMMISSIONED: 'decommissioned'
};

// Service Levels
const SERVICE_LEVELS = {
  CRITICAL: 'critical',
  ESSENTIAL: 'essential',
  SUPPORTING: 'supporting'
};

// Task Types
const TASK_TYPES = {
  PREVENTIVE_MAINTENANCE: 'preventive_maintenance',
  CORRECTIVE_MAINTENANCE: 'corrective_maintenance',
  PREDICTIVE_MAINTENANCE: 'predictive_maintenance',
  EMERGENCY_REPAIR: 'emergency_repair',
  CALIBRATION: 'calibration',
  SOFTWARE_UPDATE: 'software_update',
  FIRMWARE_UPDATE: 'firmware_update',
  CONFIGURATION_CHANGE: 'configuration_change',
  TESTING: 'testing',
  INSPECTION: 'inspection',
  CERTIFICATION: 'certification'
};

// Incident Types
const INCIDENT_TYPES = {
  FAILURE: 'failure',
  DEGRADATION: 'degradation',
  ALARM: 'alarm',
  PERFORMANCE_ISSUE: 'performance_issue',
  SAFETY_CONCERN: 'safety_concern',
  OPERATIONAL_IMPACT: 'operational_impact'
};

// Certification Types
const CERTIFICATIONS = [
  'electrical',
  'mechanical',
  'electronics',
  'rf',
  'software',
  'safety',
  'radar',
  'navigation',
  'communication'
];

module.exports = {
  SYSTEM_TYPES,
  COMMUNICATION_SUBSYSTEMS,
  NAVIGATION_SUBSYSTEMS,
  SURVEILLANCE_SUBSYSTEMS,
  DATA_PROCESSING_SUBSYSTEMS,
  METEOROLOGICAL_SUBSYSTEMS,
  SYSTEM_STATUS,
  SERVICE_LEVELS,
  TASK_TYPES,
  INCIDENT_TYPES,
  CERTIFICATIONS
};