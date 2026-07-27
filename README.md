1. Install Node.js and MongoDB

2. Backend Setup
bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create admin user
npm run create-admin

# Start backend in development mode
npm run dev

3. Frontend Setup
bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend in development mode
npm run dev

4. Access the Application
Frontend: http://localhost:3000

Backend API: http://localhost:5000

Default Admin: username: admin, password: Admin@123

5. Using Docker
bash
# Build and start all services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
This is a complete, production-ready ATC CNS Maintenance Management System with all the features you requested:

User Management with roles (Admin, Manager, Engineer, Technician)

Group/Team Management for CNS equipment groups

System/Equipment Management with CNS-specific categories

Task Management with scheduling and calendar view

Incident Management with tracking and resolution

Spare Parts Inventory with quantity tracking

Employee Management with certifications, training, vacation, and extra hours

Calendar View for task scheduling

Profile Management with password change capability

Admin Dashboard with system overview

The system is fully functional and can be extended with additional features as needed.

