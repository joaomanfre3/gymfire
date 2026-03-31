import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

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
  { name: 'Skull Crusher', slug: 'skull-crusher', muscleGroup: 'TRICEPS', equipment: 'EZ_BAR', category: 'HYPERTROPHY', difficulty: 'INTERMEDIATE' },
  { name: 'Romanian Deadlift', slug: 'romanian-deadlift', muscleGroup: 'HAMSTRINGS', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
  { name: 'Leg Curl', slug: 'leg-curl', muscleGroup: 'HAMSTRINGS', equipment: 'MACHINE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Calf Raise', slug: 'calf-raise', muscleGroup: 'CALVES', equipment: 'MACHINE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Plank', slug: 'plank', muscleGroup: 'CORE', equipment: 'BODYWEIGHT', category: 'ENDURANCE', difficulty: 'BEGINNER' },
  { name: 'Cable Crunch', slug: 'cable-crunch', muscleGroup: 'ABS', equipment: 'CABLE', category: 'HYPERTROPHY', difficulty: 'BEGINNER' },
  { name: 'Hip Thrust', slug: 'hip-thrust', muscleGroup: 'GLUTES', equipment: 'BARBELL', category: 'STRENGTH', difficulty: 'INTERMEDIATE' },
] as const;

async function main() {
  console.log('Seeding exercises...');

  for (const ex of exercises) {
    await prisma.exercise.upsert({
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
  }

  console.log(`Seeded ${exercises.length} exercises.`);
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
