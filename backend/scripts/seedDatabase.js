const mongoose = require('mongoose');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const System = require('../src/models/System');
const Task = require('../src/models/Task');
const Incident = require('../src/models/Incident');
const SparePart = require('../src/models/SparePart');
const Training = require('../src/models/Training');
const SystemType = require('../src/models/SystemType');
const Certification = require('../src/models/Certification');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Group.deleteMany({});
        await System.deleteMany({});
        await Task.deleteMany({});
        await Incident.deleteMany({});
        await SparePart.deleteMany({});
        await Training.deleteMany({});
        await SystemType.deleteMany({});
        await Certification.deleteMany({});
        console.log('Cleared existing data');

        // Create system types (with their subsystems) — admin-editable from here on
        await SystemType.create([
            {
                value: 'communication',
                label: 'Communication',
                subsystems: [
                    { value: 'vhf_radio', label: 'VHF Radio' },
                    { value: 'hf_radio', label: 'HF Radio' },
                    { value: 'satcom', label: 'SATCOM' },
                    { value: 'voip', label: 'VoIP' },
                    { value: 'intercom', label: 'Intercom' },
                    { value: 'telephone', label: 'Telephone' },
                    { value: 'gateway', label: 'Gateway' }
                ]
            },
            {
                value: 'navigation',
                label: 'Navigation',
                subsystems: [
                    { value: 'vor', label: 'VOR' },
                    { value: 'dme', label: 'DME' },
                    { value: 'ils', label: 'ILS' },
                    { value: 'ndb', label: 'NDB' },
                    { value: 'gps', label: 'GPS' },
                    { value: 'gbas', label: 'GBAS' },
                    { value: 'tacan', label: 'TACAN' }
                ]
            },
            {
                value: 'surveillance',
                label: 'Surveillance',
                subsystems: [
                    { value: 'primary_radar', label: 'Primary Radar' },
                    { value: 'secondary_radar', label: 'Secondary Radar' },
                    { value: 'ads_b', label: 'ADS-B' },
                    { value: 'mlat', label: 'MLAT' },
                    { value: 'ssr', label: 'SSR' },
                    { value: 'psr', label: 'PSR' },
                    { value: 'mode_s', label: 'Mode S' }
                ]
            },
            {
                value: 'data_processing',
                label: 'Data Processing',
                subsystems: [
                    { value: 'flight_data', label: 'Flight Data' },
                    { value: 'fdp', label: 'FDP' },
                    { value: 'aftn', label: 'AFTN' },
                    { value: 'amhs', label: 'AMHS' },
                    { value: 'atc_console', label: 'ATC Console' },
                    { value: 'fdps', label: 'FDPS' },
                    { value: 'cns_monitoring', label: 'CNS Monitoring' }
                ]
            },
            {
                value: 'meteorological',
                label: 'Meteorological',
                subsystems: [
                    { value: 'aws', label: 'AWS' },
                    { value: 'awos', label: 'AWOS' },
                    { value: 'metar', label: 'METAR' },
                    { value: 'wind_shear', label: 'Wind Shear' },
                    { value: 'ceilometer', label: 'Ceilometer' },
                    { value: 'weather_radar', label: 'Weather Radar' }
                ]
            }
        ]);
        console.log('Created system types');

        // Create certifications — admin-editable from here on
        await Certification.create([
            { value: 'electrical', label: 'Electrical' },
            { value: 'mechanical', label: 'Mechanical' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'rf', label: 'RF' },
            { value: 'software', label: 'Software' },
            { value: 'safety', label: 'Safety' },
            { value: 'radar', label: 'Radar' },
            { value: 'navigation', label: 'Navigation' },
            { value: 'communication', label: 'Communication' }
        ]);
        console.log('Created certifications');

        // Create groups
        const groups = await Group.create([
            {
                name: 'Communication Systems Group',
                description: 'Maintains all communication equipment including VHF, HF, SATCOM',
                responsibleSystemTypes: ['communication'],
                certifications: ['electronics', 'communication']
            },
            {
                name: 'Navigation Systems Group',
                description: 'Maintains navigation equipment including VOR, DME, ILS',
                responsibleSystemTypes: ['navigation'],
                certifications: ['electronics', 'navigation']
            },
            {
                name: 'Surveillance Systems Group',
                description: 'Maintains radar and surveillance systems',
                responsibleSystemTypes: ['surveillance'],
                certifications: ['electronics', 'radar']
            },
            {
                name: 'ATM Data Processing Group',
                description: 'Maintains flight data processing and ATM systems',
                responsibleSystemTypes: ['data_processing'],
                certifications: ['software', 'electronics']
            },
            {
                name: 'Meteorological Systems Group',
                description: 'Maintains weather monitoring and meteorological systems',
                responsibleSystemTypes: ['meteorological'],
                certifications: ['electronics', 'mechanical']
            }
        ]);
        console.log('Created groups');

        // Create users
        // NOTE: pass the plain-text password directly — User.create() triggers
        // the model's pre('save') hook, which hashes it. Pre-hashing here too
        // would double-hash the password and break login for every seeded user.
        const users = [];
        const userData = [
            {
                username: 'admin',
                email: 'admin@atc-system.com',
                password: 'Password@123',
                firstName: 'System',
                lastName: 'Admin',
                employeeId: 'EMP001',
                role: 'admin',
                isActive: true,
                certifications: ['electrical', 'electronics', 'software', 'safety', 'radar', 'navigation', 'communication']
            },
            {
                username: 'john.doe',
                email: 'john.doe@atc-system.com',
                password: 'Password@123',
                firstName: 'John',
                lastName: 'Doe',
                employeeId: 'EMP002',
                role: 'manager',
                group: groups[0]._id,
                isActive: true,
                certifications: ['electronics', 'communication'],
                contactInfo: {
                    phone: '+1234567890',
                    mobile: '+1234567891',
                    address: {
                        street: '123 Main St',
                        city: 'Aviation City',
                        state: 'AC',
                        zipCode: '12345',
                        country: 'USA'
                    }
                }
            },
            {
                username: 'jane.smith',
                email: 'jane.smith@atc-system.com',
                password: 'Password@123',
                firstName: 'Jane',
                lastName: 'Smith',
                employeeId: 'EMP003',
                role: 'engineer',
                group: groups[0]._id,
                isActive: true,
                certifications: ['electronics', 'communication'],
                contactInfo: {
                    phone: '+1234567892',
                    mobile: '+1234567893'
                }
            },
            {
                username: 'bob.johnson',
                email: 'bob.johnson@atc-system.com',
                password: 'Password@123',
                firstName: 'Bob',
                lastName: 'Johnson',
                employeeId: 'EMP004',
                role: 'engineer',
                group: groups[1]._id,
                isActive: true,
                certifications: ['electronics', 'navigation'],
                contactInfo: {
                    phone: '+1234567894',
                    mobile: '+1234567895'
                }
            },
            {
                username: 'alice.williams',
                email: 'alice.williams@atc-system.com',
                password: 'Password@123',
                firstName: 'Alice',
                lastName: 'Williams',
                employeeId: 'EMP005',
                role: 'technician',
                group: groups[2]._id,
                isActive: true,
                certifications: ['electronics', 'radar'],
                contactInfo: {
                    phone: '+1234567896',
                    mobile: '+1234567897'
                }
            }
        ];

        // Create users one by one
        for (const data of userData) {
            const user = await User.create(data);
            users.push(user);
        }
        console.log('Created users');

        // Create systems
        const systems = await System.create([
            {
                name: 'VHF Communication System',
                systemType: 'communication',
                subsystem: 'vhf_radio',
                serialNumber: 'VHF-001-2024',
                manufacturer: 'Rockwell Collins',
                model: 'VHF-2100',
                firmwareVersion: 'v2.1.0',
                softwareVersion: 'v3.0.1',
                installationDate: new Date('2024-01-15'),
                commissionDate: new Date('2024-02-01'),
                location: {
                    site: 'Main Tower',
                    building: 'Control Tower',
                    room: 'Comm Room',
                    rack: 'Rack A1',
                    slot: 'Slot 3',
                    coordinates: {
                        latitude: 40.7128,
                        longitude: -74.0060,
                        elevation: 10
                    }
                },
                status: 'operational',
                serviceLevel: 'critical',
                assignedGroup: groups[0]._id,
                createdBy: users[0]._id,
                criticality: 'critical',
                atsImpact: 'national',
                metrics: {
                    uptime: 99.9,
                    totalIncidents: 0
                }
            },
            {
                name: 'VOR Navigation System',
                systemType: 'navigation',
                subsystem: 'vor',
                serialNumber: 'VOR-001-2024',
                manufacturer: 'Thales',
                model: 'VOR-5000',
                firmwareVersion: 'v3.2.0',
                softwareVersion: 'v2.1.5',
                installationDate: new Date('2024-01-20'),
                commissionDate: new Date('2024-02-10'),
                location: {
                    site: 'Navigation Center',
                    building: 'Nav Building',
                    room: 'VOR Room',
                    rack: 'Rack B2',
                    slot: 'Slot 1',
                    coordinates: {
                        latitude: 40.7129,
                        longitude: -74.0058,
                        elevation: 15
                    }
                },
                status: 'operational',
                serviceLevel: 'critical',
                assignedGroup: groups[1]._id,
                createdBy: users[0]._id,
                criticality: 'critical',
                atsImpact: 'regional',
                metrics: {
                    uptime: 99.8,
                    totalIncidents: 0
                }
            },
            {
                name: 'Primary Surveillance Radar',
                systemType: 'surveillance',
                subsystem: 'primary_radar',
                serialNumber: 'RADAR-001-2024',
                manufacturer: 'Raytheon',
                model: 'ASR-9',
                firmwareVersion: 'v4.1.0',
                softwareVersion: 'v3.0.2',
                installationDate: new Date('2024-01-10'),
                commissionDate: new Date('2024-02-05'),
                location: {
                    site: 'Radar Site',
                    building: 'Radar Building',
                    room: 'Radar Room',
                    rack: 'Rack C3',
                    slot: 'Slot 2',
                    coordinates: {
                        latitude: 40.7135,
                        longitude: -74.0050,
                        elevation: 25
                    }
                },
                status: 'operational',
                serviceLevel: 'critical',
                assignedGroup: groups[2]._id,
                createdBy: users[0]._id,
                criticality: 'critical',
                atsImpact: 'national',
                metrics: {
                    uptime: 99.7,
                    totalIncidents: 1
                }
            },
            {
                name: 'Flight Data Processing System',
                systemType: 'data_processing',
                subsystem: 'fdp',
                serialNumber: 'FDP-001-2024',
                manufacturer: 'Siemens',
                model: 'FDP-3000',
                firmwareVersion: 'v2.0.0',
                softwareVersion: 'v3.1.0',
                installationDate: new Date('2024-02-01'),
                commissionDate: new Date('2024-02-15'),
                location: {
                    site: 'Data Center',
                    building: 'Server Building',
                    room: 'Server Room 1',
                    rack: 'Rack D4',
                    slot: 'Slot 5',
                    coordinates: {
                        latitude: 40.7140,
                        longitude: -74.0045,
                        elevation: 5
                    }
                },
                status: 'operational',
                serviceLevel: 'critical',
                assignedGroup: groups[3]._id,
                createdBy: users[0]._id,
                criticality: 'critical',
                atsImpact: 'national',
                metrics: {
                    uptime: 99.9,
                    totalIncidents: 0
                }
            },
            {
                name: 'Weather Monitoring System',
                systemType: 'meteorological',
                subsystem: 'aws',
                serialNumber: 'WMS-001-2024',
                manufacturer: 'Vaisala',
                model: 'AWS-300',
                firmwareVersion: 'v1.5.0',
                softwareVersion: 'v2.0.1',
                installationDate: new Date('2024-02-05'),
                commissionDate: new Date('2024-02-20'),
                location: {
                    site: 'Weather Station',
                    building: 'Meteo Building',
                    room: 'Weather Room',
                    rack: 'Rack E5',
                    slot: 'Slot 2',
                    coordinates: {
                        latitude: 40.7150,
                        longitude: -74.0040,
                        elevation: 8
                    }
                },
                status: 'operational',
                serviceLevel: 'essential',
                assignedGroup: groups[4]._id,
                createdBy: users[0]._id,
                criticality: 'high',
                atsImpact: 'local',
                metrics: {
                    uptime: 99.5,
                    totalIncidents: 0
                }
            }
        ]);
        console.log('Created systems');

        // Create spare parts
        const spareParts = await SparePart.create([
            {
                name: 'VHF Transceiver Module',
                partNumber: 'SP-001',
                description: 'VHF communication transceiver module',
                manufacturer: 'Rockwell Collins',
                quantity: 5,
                minimumQuantity: 2,
                location: 'Warehouse A1',
                compatibleSystems: [systems[0]._id],
                price: 2500,
                supplier: 'Rockwell Collins',
                leadTime: 14
            },
            {
                name: 'VOR Antenna',
                partNumber: 'SP-002',
                description: 'VOR navigation antenna',
                manufacturer: 'Thales',
                quantity: 3,
                minimumQuantity: 1,
                location: 'Warehouse B2',
                compatibleSystems: [systems[1]._id],
                price: 1200,
                supplier: 'Thales',
                leadTime: 21
            },
            {
                name: 'Radar Transmitter',
                partNumber: 'SP-003',
                description: 'Primary radar transmitter unit',
                manufacturer: 'Raytheon',
                quantity: 2,
                minimumQuantity: 1,
                location: 'Warehouse C3',
                compatibleSystems: [systems[2]._id],
                price: 5000,
                supplier: 'Raytheon',
                leadTime: 30
            },
            {
                name: 'Power Supply Unit',
                partNumber: 'SP-004',
                description: 'Universal power supply unit',
                manufacturer: 'Siemens',
                quantity: 10,
                minimumQuantity: 3,
                location: 'Warehouse A1',
                compatibleSystems: [systems[3]._id, systems[4]._id],
                price: 800,
                supplier: 'Siemens',
                leadTime: 7
            }
        ]);
        console.log('Created spare parts');

        // Create tasks - Updated with valid requiredCertifications
        const tasks = await Task.create([
            {
                title: 'Monthly VHF System Check',
                description: 'Perform comprehensive maintenance check of VHF communication system',
                taskType: 'preventive_maintenance',
                priority: 'high',
                urgency: 'this_week',
                safetyImpact: 'minor',
                atsImpact: 'local',
                system: systems[0]._id,
                assignedTo: users[2]._id,
                assignedGroup: groups[0]._id,
                createdBy: users[1]._id,
                status: 'approved',
                scheduleType: 'recursive',
                recursivePattern: {
                    frequency: 'monthly',
                    interval: 1,
                    startDate: new Date('2024-03-01'),
                    nextOccurrence: new Date('2024-04-01')
                },
                startDate: new Date('2024-03-01'),
                dueDate: new Date('2024-03-02'),
                estimatedDuration: 4,
                requiredCertifications: ['electronics', 'communication'],
                requiredTooling: ['multimeter', 'spectrum analyzer', 'power meter'],
                checklist: [
                    { item: 'Check power supply' },
                    { item: 'Test transmission' },
                    { item: 'Test reception' },
                    { item: 'Check antenna system' }
                ]
            },
            {
                title: 'VOR Calibration',
                description: 'Annual calibration of VOR navigation system',
                taskType: 'calibration',
                priority: 'critical',
                urgency: 'this_month',
                safetyImpact: 'significant',
                atsImpact: 'regional',
                system: systems[1]._id,
                assignedTo: users[3]._id,
                assignedGroup: groups[1]._id,
                createdBy: users[1]._id,
                status: 'pending_approval',
                scheduleType: 'one_time',
                startDate: new Date('2024-04-15'),
                dueDate: new Date('2024-04-20'),
                estimatedDuration: 8,
                requiredCertifications: ['navigation'],
                requiredTooling: ['test set', 'calibration equipment']
            },
            {
                title: 'Radar Software Update',
                description: 'Update radar software to latest version',
                taskType: 'software_update',
                priority: 'high',
                urgency: 'this_week',
                safetyImpact: 'minor',
                atsImpact: 'regional',
                system: systems[2]._id,
                assignedTo: users[4]._id,
                assignedGroup: groups[2]._id,
                createdBy: users[1]._id,
                status: 'in_progress',
                scheduleType: 'one_time',
                startDate: new Date('2024-03-10'),
                dueDate: new Date('2024-03-12'),
                estimatedDuration: 6,
                requiredCertifications: ['software', 'radar'],
                requiredTooling: ['laptop', 'update package']
            }
        ]);
        console.log('Created tasks');

        // Create incidents
        const incidents = await Incident.create([
            {
                system: systems[2]._id,
                title: 'Radar Signal Degradation',
                description: 'Primary surveillance radar experiencing intermittent signal loss',
                incidentType: 'degradation',
                severity: 'high',
                reportedBy: users[4]._id,
                assignedTo: users[4]._id,
                status: 'investigating',
                classification: 'incident',
                actionsTaken: [
                    {
                        action: 'Initial investigation started',
                        performedBy: users[4]._id,
                        notes: 'Checking transmitter and receiver modules'
                    }
                ]
            }
        ]);
        console.log('Created incidents');

        // Create trainings
        const trainings = await Training.create([
            {
                name: 'VHF System Maintenance Training',
                description: 'Comprehensive training on VHF communication system maintenance',
                provider: 'Rockwell Collins',
                type: 'technical',
                category: 'communication',
                duration: {
                    days: 3
                },
                cost: {
                    amount: 1500,
                    currency: 'USD'
                },
                certification: 'communication',
                certificationValidity: 24,
                maxAttendees: 15,
                schedule: {
                    startDate: new Date('2024-05-01'),
                    endDate: new Date('2024-05-03'),
                    location: 'Training Center',
                    address: {
                        street: '456 Training Blvd',
                        city: 'Aviation City',
                        state: 'AC',
                        zipCode: '12346',
                        country: 'USA'
                    }
                },
                instructor: {
                    name: 'Dr. James Wilson',
                    email: 'james.wilson@training.com',
                    phone: '+1234567899',
                    bio: 'Senior instructor with 20 years of experience'
                },
                status: 'scheduled',
                createdBy: users[0]._id,
                department: 'cns_communication',
                isMandatory: true,
                attendees: [
                    {
                        user: users[2]._id,
                        attendanceStatus: 'registered'
                    },
                    {
                        user: users[3]._id,
                        attendanceStatus: 'registered'
                    }
                ]
            },
            {
                name: 'Radar Maintenance and Troubleshooting',
                description: 'Advanced radar system maintenance and troubleshooting',
                provider: 'Raytheon',
                type: 'technical',
                category: 'radar',
                duration: {
                    days: 5
                },
                cost: {
                    amount: 2500,
                    currency: 'USD'
                },
                certification: 'radar',
                certificationValidity: 24,
                maxAttendees: 12,
                schedule: {
                    startDate: new Date('2024-06-10'),
                    endDate: new Date('2024-06-14'),
                    location: 'Radar Training Center'
                },
                instructor: {
                    name: 'Sarah Johnson',
                    email: 'sarah.johnson@raytheon.com',
                    phone: '+1234567898'
                },
                status: 'scheduled',
                createdBy: users[0]._id,
                department: 'cns_surveillance',
                isMandatory: true,
                attendees: [
                    {
                        user: users[4]._id,
                        attendanceStatus: 'registered'
                    }
                ]
            },
            {
                name: 'Safety Training for CNS Engineers',
                description: 'Essential safety training for CNS equipment maintenance',
                provider: 'ATC Safety Institute',
                type: 'safety',
                category: 'safety',
                duration: {
                    days: 2
                },
                cost: {
                    amount: 500,
                    currency: 'USD'
                },
                certification: 'safety',
                certificationValidity: 12,
                maxAttendees: 20,
                schedule: {
                    startDate: new Date('2024-04-20'),
                    endDate: new Date('2024-04-21'),
                    location: 'Safety Training Center'
                },
                instructor: {
                    name: 'Mike Thompson',
                    email: 'mike.thompson@safety.com',
                    phone: '+1234567897'
                },
                status: 'scheduled',
                createdBy: users[0]._id,
                department: 'all',
                isMandatory: true
            }
        ]);
        console.log('Created trainings');

        // Update groups with members
        await Group.findByIdAndUpdate(groups[0]._id, {
            members: [users[1]._id, users[2]._id],
            teamLead: users[1]._id,
            assignedSystems: [systems[0]._id]
        });

        await Group.findByIdAndUpdate(groups[1]._id, {
            members: [users[3]._id],
            teamLead: users[3]._id,
            assignedSystems: [systems[1]._id]
        });

        await Group.findByIdAndUpdate(groups[2]._id, {
            members: [users[4]._id],
            teamLead: users[4]._id,
            assignedSystems: [systems[2]._id]
        });

        await Group.findByIdAndUpdate(groups[3]._id, {
            assignedSystems: [systems[3]._id]
        });

        await Group.findByIdAndUpdate(groups[4]._id, {
            assignedSystems: [systems[4]._id]
        });
        console.log('Updated groups with members and systems');

        console.log('✅ Database seeded successfully!');
        console.log('\n📋 Default Users:');
        console.log('  👤 Admin: username: admin, password: Password@123');
        console.log('  👤 John Doe: username: john.doe, password: Password@123');
        console.log('  👤 Jane Smith: username: jane.smith, password: Password@123');
        console.log('  👤 Bob Johnson: username: bob.johnson, password: Password@123');
        console.log('  👤 Alice Williams: username: alice.williams, password: Password@123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.error(error.stack);
        process.exit(1);
    }
};

seedDatabase();