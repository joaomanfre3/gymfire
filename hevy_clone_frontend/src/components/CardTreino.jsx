// src/components/CardTreino.jsx
// (Não quero canvas)

import { useState, useMemo } from 'react';
import { api } from '../api.js';

/**
 * Este componente é o "cartão" individual de um treino no feed.
 * * Props que ele recebe:
 * - post: O objeto LogTreinoFeed (do backend) com todos os dados.
 * - usuarioAtual: O objeto do usuário logado (precisamos do ID dele).
 */
export default function CardTreino({ post, usuarioAtual }) {

  // --- Estados Locais ---
  // Guardamos as reações e comentários num estado local para que
  // a UI atualize instantaneamente, sem precisar recarregar o feed todo.
  const [reacoes, setReacoes] = useState(post.reacoes || []);
  const [comentarios, setComentarios] = useState(post.comentarios || []);
  
  const [novoComentario, setNovoComentario] = useState(''); // O texto no input
  
  // Estados de loading para os botões
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isLoadingComment, setIsLoadingComment] = useState(false);

  // --- Lógica de "Props" (Like) ---

  // useMemo garante que isto só é recalculado se as 'reacoes' mudarem.
  const usuarioJaReagiu = useMemo(() => {
    if (!usuarioAtual) return false;
    // Verifica se o ID do usuário logado está na lista de reações
    return reacoes.some(r => r.usuario.id === usuarioAtual.id);
  }, [reacoes, usuarioAtual]);

  // Função chamada ao clicar no botão "Props"
  const handleToggleReacao = async () => {
    setIsLoadingLike(true);
    
    try {
      if (usuarioJaReagiu) {
        // --- 1. Se já reagiu (Unlike) ---
        await api.delete(`/feed/reacao/${post.id}`);
        // Atualiza o estado local removendo a reação
        setReacoes(prevReacoes => 
          prevReacoes.filter(r => r.usuario.id !== usuarioAtual.id)
        );
      } else {
        // --- 2. Se não reagiu (Like) ---
        const response = await api.post(`/feed/reacao/${post.id}`);
        // O backend retorna a nova ReacaoPublic (incluindo o objeto 'usuario')
        const novaReacao = response.data; 
        // Atualiza o estado local adicionando a nova reação
        setReacoes(prevReacoes => [novaReacao, ...prevReacoes]);
      }
    } catch (err) {
      console.error("Erro ao dar 'props':", err);
    } finally {
      setIsLoadingLike(false);
    }
  };

  // --- Lógica de Comentários ---

  const handlePostarComentario = async (e) => {
    e.preventDefault();
    if (novoComentario.trim() === '') return; // Não envia comentário vazio

    setIsLoadingComment(true);
    
    try {
      const payload = { texto: novoComentario };
      // Chama a rota POST /feed/comentario/{id}
      const response = await api.post(`/feed/comentario/${post.id}`, payload);
      
      // O backend retorna o ComentarioPublic criado (com 'usuario')
      const comentarioCriado = response.data;
      
      // Adiciona o novo comentário ao topo da lista local
      setComentarios(prevComentarios => [comentarioCriado, ...prevComentarios]);
      setNovoComentario(''); // Limpa o input
      
    } catch (err) {
      console.error("Erro ao postar comentário:", err);
    } finally {
      setIsLoadingComment(false);
    }
  };

  // --- Helpers ---
  
  // Pega os nomes dos exercícios (sem duplicados) para mostrar no resumo
  const exerciciosFeitos = useMemo(() => {
    const nomes = post.series.map(s => s.exercicio.nome);
    return [...new Set(nomes)]; // Retorna um array de nomes únicos
  }, [post.series]);

  // Formata a data
  const dataFormatada = new Date(post.data_fim).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-zinc-800 rounded-xl shadow-lg border border-zinc-700">
      
      {/* --- 1. Cabeçalho do Card --- */}
      <div className="flex items-center p-4">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: post.usuario.cor_perfil || '#1E88E5' }}
        >
          {post.usuario.emoji_avatar || '💪'}
        </div>
        
        {/* Nome e Data */}
        <div className="ml-3 flex-1">
          <p className="font-semibold text-white">{post.usuario.nome_usuario}</p>
          <p className="text-xs text-zinc-400">{dataFormatada}</p>
        </div>
        
        {/* Pontos de Esforço */}
        <div className="text-right">
          <p className="font-bold text-lg text-blue-400">
            {post.pontos_esforco_total}
          </p>
          <p className="text-xs text-zinc-400">Pontos</p>
        </div>
      </div>

      {/* --- 2. Corpo (Resumo do Treino) --- */}
      <div className="px-4 pb-4 border-b border-zinc-700">
        <p className="text-zinc-300">
          {/* Mostra os 3 primeiros exercícios do treino */}
          {exerciciosFeitos.slice(0, 3).join(', ')}
          {exerciciosFeitos.length > 3 && ` e mais ${exerciciosFeitos.length - 3}...`}
        </p>
      </div>

      {/* --- 3. Ações Sociais (Props) --- */}
      <div className="p-4 flex items-center space-x-4">
        <button
          onClick={handleToggleReacao}
          disabled={isLoadingLike}
          className={`
            py-2 px-4 rounded-full font-semibold text-sm transition-colors
            flex items-center space-x-2
            ${usuarioJaReagiu 
              ? 'bg-blue-600 text-white' 
              : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
            }
            disabled:opacity-50
          `}
        >
          <span>👏</span>
          <span>Props</span>
        </button>
        
        {/* Contagem de "Props" */}
        {reacoes.length > 0 && (
          <span className="text-sm text-zinc-400">
            {reacoes.length} {reacoes.length === 1 ? 'Prop' : 'Props'}
          </span>
        )}
      </div>

      {/* --- 4. Comentários --- */}
      <div className="px-4 pb-4">
        {/* Lista de Comentários */}
        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {comentarios.map(com => (
            <div key={com.id} className="text-sm">
              <span className="font-semibold text-white">{com.usuario.nome_usuario}</span>
              <span className="text-zinc-300 ml-2">{com.texto}</span>
            </div>
          ))}
        </div>
        
        {/* Input para Novo Comentário */}
        <form onSubmit={handlePostarComentario} className="flex space-x-2">
          <input
            type="text"
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="flex-1 rounded-full border-0 bg-zinc-700 px-4 py-2 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingComment}
          />
          <button
            type="submit"
            disabled={isLoadingComment || novoComentario.trim() === ''}
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {/* Ícone de Enviar */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 3.105a.75.75 0 01.96 1.039L4.88 5.798l.58 2.902a.75.75 0 01-.44 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.002a.75.75 0 011.038-.439l2.902.58 1.657-.828a.75.75 0 011.04 1.04l-.828 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 011.038-.439l2.902.58 1.657-.828a.75.75 0 011.04 1.04l-.828 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 011.038-.439l2.902.58 1.657-.828a.75.75 0 011.04 1.04l-.828 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 011.038-.44l2.902.58 1.657-.829a.75.75 0 011.04 1.04l-.829 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 011.038-.439l2.902.58 1.657-.828a.75.75 0 011.04 1.04l-.828 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 011.038-.439l2.902.58 1.657-.828a.75.75 0 011.04 1.04l-.828 1.657 2.902.58a.75.75 0 01-.439 1.038l-2.001.99a.75.75 0 01-1.04-1.04l.99-2.001a.75.75 0 01.03-1.066l-1.066-.03a.75.75 0 01-1.04-1.04l-.03-.03z" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}