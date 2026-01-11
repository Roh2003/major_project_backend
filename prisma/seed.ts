import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Roles
  console.log('Creating roles...');
  
  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });

  const userRole = await prisma.roles.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Regular user/learner',
    },
  });

  const superAdminRole = await prisma.roles.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: {
      name: 'superAdmin',
      description: 'Super administrator with highest privileges',
    },
  });

  console.log('✅ Roles created');

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillup.com' },
    update: {},
    create: {
      email: 'admin@skillup.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isDeleted: false,
    },
  });

  // Assign ADMIN role to admin user
  await prisma.userRoleMapping.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created');

  // Create Demo Learner User
  console.log('Creating demo learner...');
  const learnerPassword = await bcrypt.hash('learner123', 10);
  
  const learner = await prisma.user.upsert({
    where: { email: 'learner@skillup.com' },
    update: {},
    create: {
      email: 'learner@skillup.com',
      username: 'learner',
      password: learnerPassword,
      firstName: 'Demo',
      lastName: 'Learner',
      isActive: true,
      isDeleted: false,
    },
  });

  // Assign User role to learner
  await prisma.userRoleMapping.upsert({
    where: {
      userId_roleId: {
        userId: learner.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: learner.id,
      roleId: userRole.id,
    },
  });

  console.log('✅ Demo learner created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('─────────────────────────────────────');
  console.log('👤 Admin:');
  console.log('   Email: admin@skillup.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('👤 Learner:');
  console.log('   Email: learner@skillup.com');
  console.log('   Password: learner123');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
