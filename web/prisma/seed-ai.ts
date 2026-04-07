import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding AI providers...');

  // AI Providers
  const providers = [
    {
      name: 'groq_70b',
      displayName: 'Groq LLaMA 3.3 70B',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      apiKeyEnv: 'GROQ_API_KEY',
      priority: 1,
      maxRPD: 1000,
      maxRPM: 30,
      quality: 4,
    },
    {
      name: 'gemini_flash',
      displayName: 'Gemini 2.5 Flash-Lite',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.5-flash-lite',
      apiKeyEnv: 'GEMINI_API_KEY',
      priority: 2,
      maxRPD: 1000,
      maxRPM: 15,
      quality: 5,
    },
    {
      name: 'groq_8b',
      displayName: 'Groq LLaMA 3.1 8B',
      baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
      apiKeyEnv: 'GROQ_API_KEY',
      priority: 3,
      maxRPD: 14400,
      maxRPM: 30,
      quality: 3,
    },
    {
      name: 'openrouter_qwen',
      displayName: 'OpenRouter Qwen 3.6 Plus',
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'qwen/qwen3.6-plus:free',
      apiKeyEnv: 'OPENROUTER_API_KEY',
      priority: 4,
      maxRPD: 50,
      maxRPM: 20,
      quality: 4,
    },
  ];

  for (const p of providers) {
    await prisma.aIProvider.upsert({
      where: { name: p.name },
      update: { ...p },
      create: { ...p },
    });
    console.log(`  ✓ ${p.displayName}`);
  }

  console.log('\nSeeding AI config...');

  const configs = [
    {
      key: 'systemPrompt',
      value: `Você é o GymFire AI, um personal trainer virtual especializado e motivador. Você fala português do Brasil.

REGRAS GERAIS:
- Seja direto, motivador e profissional
- Use linguagem acessível, evite jargão excessivo
- Sempre priorize a segurança do usuário
- Quando sugerir exercícios, use nomes que existem no banco de dados do app
- Formate respostas de forma clara com listas e destaques quando apropriado
- Se não tiver certeza sobre algo médico, recomende consultar um profissional

PERSONALIDADE:
- Motivador sem ser forçado
- Técnico quando necessário
- Empático com iniciantes
- Direto com avançados`,
    },
    {
      key: 'limits',
      value: { FREE: 5, PLUS: 50, PRO: 200 },
    },
    {
      key: 'features',
      value: {
        FREE: {
          QUESTION: true,
          GENERAL: true,
          GENERATE_WORKOUT: false,
          SUBSTITUTE_EXERCISE: false,
          WEEKLY_PLAN: false,
          PROGRESS_ANALYSIS: false,
          DIET_NUTRITION: false,
          PERIODIZATION: false,
        },
        PLUS: {
          QUESTION: true,
          GENERAL: true,
          GENERATE_WORKOUT: true,
          SUBSTITUTE_EXERCISE: true,
          WEEKLY_PLAN: false,
          PROGRESS_ANALYSIS: false,
          DIET_NUTRITION: false,
          PERIODIZATION: false,
        },
        PRO: {
          QUESTION: true,
          GENERAL: true,
          GENERATE_WORKOUT: true,
          SUBSTITUTE_EXERCISE: true,
          WEEKLY_PLAN: true,
          PROGRESS_ANALYSIS: true,
          DIET_NUTRITION: true,
          PERIODIZATION: true,
        },
      },
    },
    {
      key: 'globalEnabled',
      value: true,
    },
    {
      key: 'maxTokens',
      value: 1024,
    },
    {
      key: 'temperature',
      value: 0.7,
    },
    {
      key: 'minQualityPerPlan',
      value: { FREE: 1, PLUS: 3, PRO: 4 },
    },
  ];

  for (const c of configs) {
    await prisma.aIConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: { key: c.key, value: c.value },
    });
    console.log(`  ✓ ${c.key}`);
  }

  console.log('\n✅ AI seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
