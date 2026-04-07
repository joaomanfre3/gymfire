// Intent classifier - analyzes user message BEFORE sending to AI
// This runs on the server, costs zero AI requests

export type AIIntent =
  | 'QUESTION'
  | 'GENERATE_WORKOUT'
  | 'SUBSTITUTE_EXERCISE'
  | 'WEEKLY_PLAN'
  | 'PROGRESS_ANALYSIS'
  | 'DIET_NUTRITION'
  | 'PERIODIZATION'
  | 'GENERAL';

interface IntentRule {
  intent: AIIntent;
  keywords: string[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'GENERATE_WORKOUT',
    keywords: [
      'monta treino', 'cria treino', 'gera treino', 'me faz um treino',
      'treino de peito', 'treino de costas', 'treino de perna', 'treino de braço',
      'treino de ombro', 'treino completo', 'monte um treino', 'crie um treino',
      'gere um treino', 'treino para', 'ficha de treino', 'montar treino',
      'criar treino', 'gerar treino', 'me passa um treino', 'sugira um treino',
      'preciso de um treino', 'quero um treino',
    ],
  },
  {
    intent: 'DIET_NUTRITION',
    keywords: [
      'dieta', 'alimentação', 'nutrição', 'o que comer', 'refeição',
      'cardápio', 'calorias', 'macros', 'proteína', 'carboidrato',
      'plano alimentar', 'suplemento', 'whey', 'creatina', 'pré-treino',
      'pós-treino', 'café da manhã', 'almoço', 'jantar', 'lanche',
      'emagrecer comendo', 'ganhar massa comendo',
    ],
  },
  {
    intent: 'WEEKLY_PLAN',
    keywords: [
      'plano semanal', 'plano mensal', 'programação semanal', 'programa de treino',
      'rotina semanal', 'divisão de treino', 'split', 'abc', 'abcde',
      'quantos dias treinar', 'montar programa', 'planejar semana',
      'periodizar', 'mesociclo', 'macrociclo',
    ],
  },
  {
    intent: 'PERIODIZATION',
    keywords: [
      'periodização', 'periodizar', 'fase de volume', 'fase de força',
      'fase de cutting', 'fase de bulking', 'deload', 'semana de descanso',
      'progressão de carga', 'linear progression', 'undulating',
    ],
  },
  {
    intent: 'PROGRESS_ANALYSIS',
    keywords: [
      'meu progresso', 'minha evolução', 'como estou indo', 'analisa meu',
      'analisar meu', 'meus resultados', 'meu desempenho', 'minha performance',
      'estou evoluindo', 'estou melhorando', 'meu histórico',
      'comparar treinos', 'meus números',
    ],
  },
  {
    intent: 'SUBSTITUTE_EXERCISE',
    keywords: [
      'substituir', 'trocar exercício', 'alternativa para', 'no lugar de',
      'substituição', 'trocar por', 'pode trocar', 'opção para substituir',
      'exercício parecido', 'exercício similar', 'equivalente',
    ],
  },
  {
    intent: 'QUESTION',
    keywords: [
      'como fazer', 'como executar', 'forma correta', 'técnica de',
      'o que é', 'para que serve', 'qual a diferença', 'é melhor',
      'quantas séries', 'quantas repetições', 'quanto peso',
      'dúvida sobre', 'me explica', 'como funciona',
    ],
  },
];

export function classifyIntent(message: string): AIIntent {
  const normalized = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const rule of INTENT_RULES) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normalizedKeyword)) {
        return rule.intent;
      }
    }
  }

  return 'GENERAL';
}

// Human-readable labels for blocked messages
const INTENT_LABELS: Record<AIIntent, { label: string; minPlan: string }> = {
  QUESTION: { label: 'Perguntas', minPlan: 'FREE' },
  GENERAL: { label: 'Conversa geral', minPlan: 'FREE' },
  GENERATE_WORKOUT: { label: 'Geração de treinos', minPlan: 'PLUS' },
  SUBSTITUTE_EXERCISE: { label: 'Substituição de exercícios', minPlan: 'PLUS' },
  WEEKLY_PLAN: { label: 'Planos semanais/mensais', minPlan: 'PRO' },
  PROGRESS_ANALYSIS: { label: 'Análise de progresso', minPlan: 'PRO' },
  DIET_NUTRITION: { label: 'Nutrição e dieta', minPlan: 'PRO' },
  PERIODIZATION: { label: 'Periodização', minPlan: 'PRO' },
};

export function getBlockedMessage(intent: AIIntent): string {
  const info = INTENT_LABELS[intent];
  return `🔒 ${info.label} é exclusivo do plano ${info.minPlan}. Faça upgrade para desbloquear!`;
}
