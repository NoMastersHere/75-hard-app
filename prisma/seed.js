const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@75hard.com' },
    update: {},
    create: {
      email: 'demo@75hard.com',
      password,
      name: 'Demo User',
      displayName: 'Demo',
    },
  });

  // Create default settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      workoutDuration: 45,
      hydrationGoal: 1.0,
      readingGoal: 10,
    },
  });

  // Create an active challenge
  const challenge = await prisma.challenge.create({
    data: {
      userId: user.id,
      startDate: new Date(),
      currentDay: 1,
      status: 'active',
      completedDays: 0,
    },
  });

  console.log(`Seeded user: ${user.email}`);
  console.log(`Seeded challenge: ${challenge.id} (Day ${challenge.currentDay})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
