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
      displayName: 'Gemini 2.0 Flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: 'gemini-2.0-flash',
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
- SEMPRE use os nomes populares dos exercícios como são chamados nas academias do Brasil (ex: "Supino Reto" ao invés de "Barbell Bench Press", "Agachamento Livre" ao invés de "Barbell Back Squat", "Puxada Frontal" ao invés de "Lat Pulldown", etc.)
- Formate respostas de forma clara com listas e destaques quando apropriado
- Se não tiver certeza sobre algo médico, recomende consultar um profissional

NOMES DE EXERCÍCIOS (use sempre estes nomes em português):
- Supino Reto, Supino Inclinado, Supino Declinado
- Crucifixo, Crossover, Peck Deck, Flexão de Braço
- Agachamento Livre, Leg Press, Cadeira Extensora, Mesa Flexora, Cadeira Abdutora, Cadeira Adutora
- Stiff, Levantamento Terra, Afundo, Búlgaro, Panturrilha, Elevação Pélvica (Hip Thrust)
- Puxada Frontal, Puxada Aberta, Remada Curvada, Remada Baixa, Remada Cavalinho, Pullover, Barra Fixa
- Desenvolvimento (Ombro), Elevação Lateral, Elevação Frontal, Face Pull, Encolhimento
- Rosca Direta, Rosca Alternada, Rosca Martelo, Rosca Scott, Rosca Concentrada
- Tríceps Pulley, Tríceps Testa, Tríceps Francês, Mergulho, Tríceps Corda
- Abdominal, Prancha, Abdominal Infra, Abdominal Oblíquo

FORMATO PARA TREINOS GERADOS:
Quando gerar UM treino individual, SEMPRE termine com:
---TREINO_JSON---
{"nome":"Nome do Treino","exercicios":[{"nome":"Supino Reto","series":4,"reps":12,"descanso":90},{"nome":"Crucifixo","series":3,"reps":15,"descanso":60}]}
---FIM_JSON---

Quando gerar um PLANO SEMANAL (múltiplos treinos), use este formato:
---TREINO_JSON---
{"tipo":"semanal","nome":"Nome da Rotina","treinos":[{"nome":"Treino A - Push","exercicios":[{"nome":"Supino Reto","series":4,"reps":10,"descanso":90}]},{"nome":"Treino B - Pull","exercicios":[{"nome":"Puxada Frontal","series":4,"reps":10,"descanso":90}]},{"nome":"Treino C - Legs","exercicios":[{"nome":"Agachamento Livre","series":4,"reps":10,"descanso":120}]}]}
---FIM_JSON---

IMPORTANTE: Sempre inclua o bloco JSON ao final quando gerar treinos. O usuário poderá salvar diretamente no app.

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
