import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      app: '🔥 GymFire API',
      status: 'online',
      version: '1.0.0',
      endpoints: {
        auth: {
          'POST /auth/register': 'Criar conta (body: email, username, password, displayName)',
          'POST /auth/login': 'Login (body: username, password)',
          'POST /auth/refresh': 'Renovar token (body: refreshToken)',
          'POST /auth/logout': 'Logout [auth]',
          'GET /auth/me': 'Perfil do usuário logado [auth]',
        },
        exercises: {
          'GET /exercises': 'Listar exercícios (query: muscleGroup, equipment, category, search) [auth]',
          'GET /exercises/:id': 'Detalhe do exercício [auth]',
          'POST /exercises': 'Criar exercício custom [auth]',
        },
        folders: {
          'GET /folders': 'Listar pastas [auth]',
          'POST /folders': 'Criar pasta [auth]',
          'PATCH /folders/:id': 'Editar pasta [auth]',
          'DELETE /folders/:id': 'Deletar pasta [auth]',
        },
        routines: {
          'GET /routines': 'Listar rotinas [auth]',
          'POST /routines': 'Criar rotina [auth]',
          'GET /routines/:id': 'Detalhe da rotina [auth]',
          'POST /routines/:id/sets': 'Adicionar exercício à rotina [auth]',
        },
        workouts: {
          'POST /workouts/start': 'Iniciar treino [auth]',
          'POST /workouts/:id/sets': 'Adicionar série (detecta PR) [auth]',
          'POST /workouts/:id/finish': 'Finalizar treino (calcula pontos) [auth]',
          'GET /workouts/:id': 'Detalhe do treino [auth]',
          'GET /workouts': 'Histórico de treinos [auth]',
        },
        social: {
          'POST /social/follow/:userId': 'Seguir usuário [auth]',
          'DELETE /social/follow/:userId': 'Deixar de seguir [auth]',
          'POST /social/posts': 'Criar post [auth]',
          'POST /social/posts/:id/like': 'Curtir post [auth]',
          'POST /social/posts/:id/fire': 'Reagir com 🔥 [auth]',
          'POST /social/posts/:id/comments': 'Comentar [auth]',
        },
        feed: {
          'GET /feed': 'Feed social (query: skip, limit) [auth]',
          'GET /feed/:id': 'Post completo [auth]',
        },
        ranking: {
          'GET /ranking/weekly': 'Ranking semanal [auth]',
          'GET /ranking/all-time': 'Ranking geral [auth]',
        },
        chat: {
          'GET /chat/conversations': 'Listar conversas [auth]',
          'POST /chat/conversations': 'Nova conversa [auth]',
          'GET /chat/conversations/:id/messages': 'Mensagens [auth]',
          'POST /chat/conversations/:id/messages': 'Enviar mensagem [auth]',
        },
        speeds: {
          'POST /speeds': 'Criar Speed (story) [auth]',
          'GET /speeds/feed': 'Feed de Speeds [auth]',
          'GET /speeds/user/:userId': 'Speeds de um usuário [auth]',
        },
        streak: {
          'GET /streak/status': 'Status do foguinho 🔥 [auth]',
        },
        users: {
          'GET /users/search/:query': 'Buscar usuários [auth]',
          'GET /users/:username': 'Perfil público',
          'PATCH /users/profile': 'Editar perfil [auth]',
        },
        notifications: {
          'GET /notifications': 'Listar notificações [auth]',
          'GET /notifications/unread-count': 'Contagem não lidas [auth]',
        },
        premium: {
          'GET /premium/status': 'Status premium [auth]',
          'GET /premium/limits': 'Limites do plano [auth]',
        },
      },
      note: '[auth] = requer header Authorization: Bearer <token>',
    };
  }
}
