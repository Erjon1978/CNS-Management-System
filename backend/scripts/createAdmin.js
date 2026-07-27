const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      username: 'admin',
      email: 'cns@albcontrol.al',
      password: 'Admin@123',
      firstName: 'Erjon',
      lastName: 'Xama',
      employeeId: 'ADMIN001',
      role: 'admin',
      isActive: true,
      certifications: ['electrical', 'electronics', 'software', 'safety', 'radar', 'navigation', 'communication']
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Admin@123');
    console.log('Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();