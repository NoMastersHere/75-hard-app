require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./services/db');

async function main() {
  const email = 'swords987@gmail.com';
  const password = 'justgettingstarted';
  const totalBacklogDays = 107;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: null,
      settings: { create: {} },
    },
  });
  console.log('Created user:', user.id, user.email);

  // Calculate start date: 107 days ago from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalBacklogDays - 1)); // Day 1 was 106 days ago

  // Create the challenge
  const challenge = await prisma.challenge.create({
    data: {
      userId: user.id,
      startDate,
      currentDay: totalBacklogDays,
      status: 'active',
      completedDays: totalBacklogDays,
    },
  });
  console.log('Created challenge:', challenge.id, 'starting', startDate.toISOString().split('T')[0]);

  // Backfill day logs for all 107 days
  const logs = [];
  for (let day = 1; day <= totalBacklogDays; day++) {
    const logDate = new Date(startDate);
    logDate.setDate(logDate.getDate() + (day - 1));

    logs.push({
      challengeId: challenge.id,
      userId: user.id,
      dayNumber: day,
      date: logDate,
      workout1Complete: true,
      workout1Duration: 45,
      workout2Complete: true,
      workout2Duration: 45,
      waterIntake: 16,
      waterComplete: true,
      pagesRead: 10,
      readingComplete: true,
      dietCompliant: true,
      allTasksComplete: true,
    });
  }

  await prisma.dayLog.createMany({ data: logs });
  console.log(`Created ${logs.length} day logs (Day 1 to Day ${totalBacklogDays})`);
  console.log('Done! User can log in at swords987@gmail.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
