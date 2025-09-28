import { PrismaClient, UserRole, ManagerLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hrms.com' },
    update: {},
    create: {
      email: 'admin@hrms.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hrms.com' },
    update: {},
    create: {
      email: 'manager@hrms.com',
      username: 'manager',
      password: managerPassword,
      firstName: 'John',
      lastName: 'Manager',
      role: UserRole.MANAGER,
    },
  });

  // Create manager record
  const managerRecord = await prisma.manager.upsert({
    where: { userId: manager.id },
    update: {},
    create: {
      userId: manager.id,
      department: 'Human Resources',
      level: ManagerLevel.DEPARTMENT_HEAD,
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 10);
  
  const employee = await prisma.user.upsert({
    where: { email: 'employee@hrms.com' },
    update: {},
    create: {
      email: 'employee@hrms.com',
      username: 'employee',
      password: employeePassword,
      firstName: 'Jane',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
    },
  });

  // Create employee record
  const employeeRecord = await prisma.employee.upsert({
    where: { userId: employee.id },
    update: {},
    create: {
      employeeId: 'EMP001',
      department: 'Human Resources',
      position: 'HR Specialist',
      salary: 50000,
      hireDate: new Date('2023-01-15'),
      userId: employee.id,
      managerId: managerRecord.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user created:', admin.email);
  console.log('👤 Manager user created:', manager.email);
  console.log('👤 Employee user created:', employee.email);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
