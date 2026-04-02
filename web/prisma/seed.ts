import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const exercises = [
  { name: 'Bench Press', slug: 'bench-press', muscleGroup: 'CHEST', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Incline Bench Press', slug: 'incline-bench-press', muscleGroup: 'CHEST', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Dumbbell Fly', slug: 'dumbbell-fly', muscleGroup: 'CHEST', equipment: 'DUMBBELL', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Squat', slug: 'squat', muscleGroup: 'QUADS', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Leg Press', slug: 'leg-press', muscleGroup: 'QUADS', equipment: 'MACHINE', category: 'STRENGTH', difficulty: 'BEGINNER' },
  { name: 'Lunges', slug: 'lunges', muscleGroup: 'QUADS', equipment: 'DUMBBELL', category: 'STRENGTH', difficulty: 'BEGINNER' },
  { name: 'Deadlift', slug: 'deadlift', muscleGroup: 'BACK', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'ADVANCED' },
  { name: 'Barbell Row', slug: 'barbell-row', muscleGroup: 'BACK', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Lat Pulldown', slug: 'lat-pulldown', muscleGroup: 'BACK', equipment: 'CABLE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Pull Up', slug: 'pull-up', muscleGroup: 'BACK', equipment: 'PULL_UP_BAR', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Overhead Press', slug: 'overhead-press', muscleGroup: 'SHOULDERS', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Lateral Raise', slug: 'lateral-raise', muscleGroup: 'SHOULDERS', equipment: 'DUMBBELL', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Barbell Curl', slug: 'barbell-curl', muscleGroup: 'BICEPS', equipment: 'BARBELL', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Hammer Curl', slug: 'hammer-curl', muscleGroup: 'BICEPS', equipment: 'DUMBBELL', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Tricep Pushdown', slug: 'tricep-pushdown', muscleGroup: 'TRICEPS', equipment: 'CABLE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Skull Crusher', slug: 'skull-crusher', muscleGroup: 'TRICEPS', equipment: 'BARBELL', category: 'HYPERTROPHY', difficulty: 'INTERMEDIATE' },
  { name: 'Romanian Deadlift', slug: 'romanian-deadlift', muscleGroup: 'HAMSTRINGS', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Leg Curl', slug: 'leg-curl', muscleGroup: 'HAMSTRINGS', equipment: 'MACHINE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Calf Raise', slug: 'calf-raise', muscleGroup: 'CALVES', equipment: 'MACHINE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Plank', slug: 'plank', muscleGroup: 'CORE', equipment: 'BODYWEIGHT', category: 'ENDURANCE', difficulty: 'BEGINNER' },
  { name: 'Cable Crunch', slug: 'cable-crunch', muscleGroup: 'ABS', equipment: 'CABLE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Hip Thrust', slug: 'hip-thrust', muscleGroup: 'GLUTES', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
] as const;

const seedUsers = [
  { username: 'rafael.lima', displayName: 'Rafael Lima', email: 'rafael@gymfire.app', bio: 'CrossFit lover. Sub-5 Fran.', totalPoints: 24580, currentStreak: 45, longestStreak: 45 },
  { username: 'anabeatriz.fit', displayName: 'Ana Beatriz', email: 'ana@gymfire.app', bio: 'Treino todos os dias. PRO athlete.', totalPoints: 21340, currentStreak: 32, longestStreak: 40, isVerified: true },
  { username: 'carlos.runner', displayName: 'Carlos Eduardo', email: 'carlos@gymfire.app', bio: 'Corredor do Ibirapuera.', totalPoints: 19870, currentStreak: 28, longestStreak: 35 },
  { username: 'pedro.iron', displayName: 'Pedro Santos', email: 'pedro@gymfire.app', bio: 'Supino é meu exercício favorito.', totalPoints: 16450, currentStreak: 19, longestStreak: 25 },
  { username: 'marina.costa', displayName: 'Marina Costa', email: 'marina@gymfire.app', bio: '30 dias de fogo!', totalPoints: 15200, currentStreak: 22, longestStreak: 30, isVerified: true },
  { username: 'thiago.strong', displayName: 'Thiago Rocha', email: 'thiago@gymfire.app', bio: 'Transformação em progresso.', totalPoints: 13890, currentStreak: 15, longestStreak: 20 },
  { username: 'ju.mendes', displayName: 'Julia Mendes', email: 'julia@gymfire.app', bio: 'Começando minha jornada fitness.', totalPoints: 12340, currentStreak: 12, longestStreak: 12 },
  { username: 'fe.silva', displayName: 'Fernanda Silva', email: 'fernanda@gymfire.app', bio: 'Primeira meia maratona!', totalPoints: 11200, currentStreak: 8, longestStreak: 15 },
  { username: 'demo', displayName: 'Usuário Demo', email: 'demo@gymfire.app', bio: 'Conta de demonstração do GymFire.', totalPoints: 5000, currentStreak: 5, longestStreak: 10 },
];

async function main() {
  console.log('🔥 Starting GymFire seed...');

  // 1. Seed exercises
  console.log('📋 Seeding exercises...');
  const exerciseIds: string[] = [];
  for (const ex of exercises) {
    const created = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {},
      create: {
        name: ex.name,
        slug: ex.slug,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        category: ex.category,
        difficulty: ex.difficulty,
        isPublic: true,
        isFromLibrary: true,
      },
    });
    exerciseIds.push(created.id);
  }
  console.log(`   ✅ ${exercises.length} exercises seeded`);

  // 2. Seed users
  console.log('👤 Seeding users...');
  const passwordHash = await bcrypt.hash('gymfire123', 12);
  const userIds: string[] = [];

  for (const u of seedUsers) {
    const created = await prisma.user.upsert({
      where: { username: u.username },
      update: {
        totalPoints: u.totalPoints,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
      },
      create: {
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        passwordHash,
        bio: u.bio,
        totalPoints: u.totalPoints,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        isVerified: (u as Record<string, unknown>).isVerified === true,
      },
    });
    userIds.push(created.id);
  }
  console.log(`   ✅ ${seedUsers.length} users seeded (password: gymfire123)`);

  // 3. Seed follows (create a social graph)
  console.log('🔗 Seeding follows...');
  let followCount = 0;
  for (let i = 0; i < userIds.length; i++) {
    // Each user follows 3-5 random other users
    const numFollows = 3 + Math.floor(Math.random() * 3);
    const targets = userIds.filter((_, j) => j !== i).sort(() => Math.random() - 0.5).slice(0, numFollows);
    for (const targetId of targets) {
      try {
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: userIds[i], followingId: targetId } },
          update: {},
          create: { followerId: userIds[i], followingId: targetId },
        });
        followCount++;
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`   ✅ ${followCount} follows created`);

  // 4. Seed workouts + posts for each user
  console.log('🏋️ Seeding workouts and posts...');
  let workoutCount = 0;
  let postCount = 0;

  for (let u = 0; u < userIds.length; u++) {
    const userId = userIds[u];
    const numWorkouts = 3 + Math.floor(Math.random() * 5);

    for (let w = 0; w < numWorkouts; w++) {
      const daysAgo = w * 2 + Math.floor(Math.random() * 2);
      const startedAt = new Date(Date.now() - daysAgo * 86400000);
      const durationSecs = 2400 + Math.floor(Math.random() * 3600); // 40min - 100min
      const finishedAt = new Date(startedAt.getTime() + durationSecs * 1000);

      // Pick 3-5 random exercises
      const workoutExercises = exerciseIds.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3));
      let totalVolume = 0;
      let totalSets = 0;
      let totalReps = 0;

      const workout = await prisma.workout.create({
        data: {
          userId,
          title: ['Treino de Peito', 'Treino de Costas', 'Treino de Pernas', 'Treino de Ombros', 'Treino Full Body'][w % 5],
          startedAt,
          finishedAt,
          durationSecs,
          totalVolume: 0,
          totalSets: 0,
          totalReps: 0,
        },
      });

      // Create sets for each exercise
      for (const exId of workoutExercises) {
        const numSets = 3 + Math.floor(Math.random() * 2);
        for (let s = 0; s < numSets; s++) {
          const weight = 20 + Math.floor(Math.random() * 100);
          const reps = 6 + Math.floor(Math.random() * 10);
          await prisma.workoutSet.create({
            data: {
              workoutId: workout.id,
              exerciseId: exId,
              setNumber: s + 1,
              weight,
              reps,
            },
          });
          totalVolume += weight * reps;
          totalSets++;
          totalReps += reps;
        }
      }

      // Update workout totals
      await prisma.workout.update({
        where: { id: workout.id },
        data: { totalVolume, totalSets, totalReps },
      });

      workoutCount++;

      // Create a post for some workouts
      if (Math.random() > 0.3) {
        const captions = [
          'Treino intenso hoje! Cada série contou.',
          'Progressão consistente. Os resultados aparecem.',
          'Dia de perna é dia de guerra!',
          'Novo PR batido! A dedicação vale a pena.',
          'Mais um dia, mais um treino. Consistência acima de tudo.',
          'Quem treina cedo, descansa cedo.',
          'CrossFit WOD destruidor hoje.',
          'A academia é minha terapia.',
        ];
        await prisma.post.create({
          data: {
            userId,
            caption: captions[Math.floor(Math.random() * captions.length)],
            type: 'WORKOUT',
            visibility: 'PUBLIC',
            workoutId: workout.id,
          },
        });
        postCount++;
      }
    }
  }
  console.log(`   ✅ ${workoutCount} workouts created`);
  console.log(`   ✅ ${postCount} posts created`);

  // 5. Seed point transactions for ranking
  console.log('⭐ Seeding point transactions...');
  for (let u = 0; u < userIds.length; u++) {
    const points = seedUsers[u].totalPoints;
    // Create a few point transactions to simulate weekly activity
    const weeklyPoints = Math.floor(points * 0.15); // ~15% of total is "this week"
    await prisma.pointTransaction.create({
      data: {
        userId: userIds[u],
        amount: weeklyPoints,
        type: 'WORKOUT_COMPLETE',
        description: 'Treinos da semana',
      },
    });
  }
  console.log(`   ✅ Point transactions created`);

  // 6. Seed some likes
  console.log('❤️ Seeding likes...');
  const posts = await prisma.post.findMany({ take: 50 });
  let likeCount = 0;
  for (const post of posts) {
    const numLikes = 2 + Math.floor(Math.random() * 5);
    const likers = userIds.filter(id => id !== post.userId).sort(() => Math.random() - 0.5).slice(0, numLikes);
    for (const likerId of likers) {
      try {
        await prisma.like.create({
          data: { userId: likerId, postId: post.id },
        });
        likeCount++;
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`   ✅ ${likeCount} likes created`);

  console.log('\n🔥 GymFire seed complete!');
  console.log('   Login: demo@gymfire.app / gymfire123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
