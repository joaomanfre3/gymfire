/**
 * Import 800+ exercises from free-exercise-db (GitHub, public domain)
 * Source: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
 *
 * Run: npx tsx prisma/import-exercises.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, MuscleGroup, Equipment, ExerciseCategory, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Translation maps
const muscleTranslations: Record<string, string> = {
  'abdominals': 'ABS',
  'abductors': 'GLUTES',
  'adductors': 'QUADS',
  'biceps': 'BICEPS',
  'calves': 'CALVES',
  'chest': 'CHEST',
  'forearms': 'FOREARMS',
  'glutes': 'GLUTES',
  'hamstrings': 'HAMSTRINGS',
  'lats': 'BACK',
  'lower_back': 'BACK',
  'middle_back': 'BACK',
  'neck': 'SHOULDERS',
  'quadriceps': 'QUADS',
  'shoulders': 'SHOULDERS',
  'traps': 'BACK',
  'triceps': 'TRICEPS',
};

const equipmentTranslations: Record<string, string> = {
  'barbell': 'BARBELL',
  'dumbbell': 'DUMBBELL',
  'cable': 'CABLE',
  'machine': 'MACHINE',
  'body_only': 'BODYWEIGHT',
  'body only': 'BODYWEIGHT',
  'other': 'OTHER',
  'kettlebells': 'KETTLEBELL',
  'e-z_curl_bar': 'BARBELL',
  'e-z curl bar': 'BARBELL',
  'bands': 'OTHER',
  'foam_roll': 'OTHER',
  'foam roll': 'OTHER',
  'medicine_ball': 'OTHER',
  'medicine ball': 'OTHER',
  'exercise_ball': 'OTHER',
  'exercise ball': 'OTHER',
};

const categoryMap: Record<string, string> = {
  'strength': 'STRENGTH',
  'stretching': 'ENDURANCE',
  'plyometrics': 'POWER',
  'cardio': 'CARDIO',
  'powerlifting': 'POWER',
  'strongman': 'STRENGTH',
  'olympic_weightlifting': 'POWER',
  'olympic weightlifting': 'POWER',
};

const difficultyMap: Record<string, string> = {
  'beginner': 'BEGINNER',
  'intermediate': 'INTERMEDIATE',
  'expert': 'ADVANCED',
};

// Common exercise name translations (EN → PT-BR)
const nameTranslations: Record<string, string> = {
  'Barbell Bench Press - Medium Grip': 'Supino Reto com Barra',
  'Incline Barbell Bench Press': 'Supino Inclinado com Barra',
  'Decline Barbell Bench Press': 'Supino Declinado com Barra',
  'Dumbbell Bench Press': 'Supino Reto com Halteres',
  'Dumbbell Flyes': 'Crucifixo com Halteres',
  'Pushups': 'Flexão de Braço',
  'Barbell Squat': 'Agachamento Livre',
  'Leg Press': 'Leg Press',
  'Leg Extensions': 'Cadeira Extensora',
  'Barbell Deadlift': 'Levantamento Terra',
  'Bent Over Barbell Row': 'Remada Curvada com Barra',
  'Wide-Grip Lat Pulldown': 'Puxada Frontal Aberta',
  'Pull Up': 'Barra Fixa',
  'Pullups': 'Barra Fixa',
  'Chin-Up': 'Barra Fixa Supinada',
  'Standing Military Press': 'Desenvolvimento Militar',
  'Dumbbell Shoulder Press': 'Desenvolvimento com Halteres',
  'Side Lateral Raise': 'Elevação Lateral',
  'Barbell Curl': 'Rosca Direta com Barra',
  'Dumbbell Bicep Curl': 'Rosca Direta com Halteres',
  'Hammer Curls': 'Rosca Martelo',
  'Triceps Pushdown': 'Tríceps na Polia',
  'Lying Triceps Press': 'Tríceps Testa',
  'Close-Grip Barbell Bench Press': 'Supino Fechado',
  'Romanian Deadlift': 'Stiff',
  'Lying Leg Curls': 'Mesa Flexora',
  'Standing Calf Raises': 'Elevação de Panturrilha',
  'Plank': 'Prancha',
  'Crunches': 'Abdominal',
  'Barbell Hip Thrust': 'Hip Thrust com Barra',
  'Dips - Chest Version': 'Mergulho (Peito)',
  'Dips - Triceps Version': 'Mergulho (Tríceps)',
  'Cable Crossover': 'Crossover no Cabo',
  'Face Pull': 'Face Pull',
  'Seated Cable Rows': 'Remada Sentada no Cabo',
  'T-Bar Row': 'Remada Cavalinho',
  'Barbell Shrug': 'Encolhimento com Barra',
  'Front Barbell Squat': 'Agachamento Frontal',
  'Hack Squat': 'Hack Squat',
  'Walking Dumbbell Lunge': 'Avanço com Halteres',
  'Stiff-Legged Barbell Deadlift': 'Stiff com Barra',
  'Seated Leg Curl': 'Cadeira Flexora',
  'Donkey Calf Raises': 'Panturrilha no Burro',
  'Ab Crunch Machine': 'Abdominal na Máquina',
  'Hanging Leg Raise': 'Elevação de Pernas na Barra',
  'Cable Crunch': 'Abdominal no Cabo',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface FreeExercise {
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
}

async function main() {
  console.log('🔥 Importing exercises from free-exercise-db...');

  // Fetch exercise data
  const response = await fetch(
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch exercises: ${response.status}`);
  }

  const exercises: FreeExercise[] = await response.json();
  console.log(`📋 Found ${exercises.length} exercises`);

  let imported = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const primaryMuscle = ex.primaryMuscles?.[0]?.toLowerCase() || '';
    const muscleGroup = (muscleTranslations[primaryMuscle] || 'FULL_BODY') as MuscleGroup;
    const equipment = (equipmentTranslations[ex.equipment?.toLowerCase() || ''] || 'OTHER') as Equipment;
    const category = (categoryMap[ex.category?.toLowerCase() || ''] || 'STRENGTH') as ExerciseCategory;
    const difficulty = (difficultyMap[ex.level?.toLowerCase() || ''] || 'INTERMEDIATE') as Difficulty;
    const slug = slugify(ex.name);

    // Translate name if available
    const translatedName = nameTranslations[ex.name] || ex.name;

    try {
      await prisma.exercise.upsert({
        where: { slug },
        update: {
          muscleGroup,
          equipment,
          category,
          difficulty,
        },
        create: {
          name: translatedName,
          slug,
          muscleGroup,
          equipment,
          category,
          difficulty,
          instructions: ex.instructions || [],
          isPublic: true,
          isFromLibrary: true,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  console.log(`✅ Imported: ${imported} exercises`);
  console.log(`⏭️  Skipped: ${skipped} (duplicates or errors)`);
  console.log('🔥 Done!');
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
