// src/pages/FeedPage.jsx
// (Não quero canvas)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js'; // Importa o nosso cliente de API

// --- CORREÇÃO 1: IMPORTAR O NOVO CARD ---
import CardTreino from '../components/CardTreino.jsx';

export default function FeedPage() {
  const [feed, setFeed] = useState([]); // Armazena os posts do feed
  const [usuarioAtual, setUsuarioAtual] = useState(null); // Armazena quem está logado
  const [loading, setLoading] = useState(true); // Controla a mensagem "Carregando..."
  const [error, setError] = useState(null); // Armazena mensagens de erro
  const navigate = useNavigate();

  // --- Função de Logout ---
  const handleLogout = () => {
    localStorage.removeItem('token'); 
    api.defaults.headers.common['Authorization'] = null; 
    navigate('/login'); 
  };

  // --- CORREÇÃO 2: ATUALIZAR O USEEFFECT ---
  // Agora ele busca o Feed E os dados do usuário logado
  useEffect(() => {
    const fetchDadosIniciais = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Vamos fazer as duas chamadas em paralelo
        const [respostaFeed, respostaUsuario] = await Promise.all([
          api.get('/feed'), // 1. Busca os posts do feed
          api.get('/auth/me')  // 2. Busca os dados do usuário logado (ex: ID)
        ]);
        
        setFeed(respostaFeed.data); // Guarda os posts
        setUsuarioAtual(respostaUsuario.data); // Guarda o usuário
        setLoading(false); // Para de carregar

      } catch (err) {
        console.error("Erro ao buscar dados iniciais do feed:", err);
        
        if (err.response && err.response.status === 401) {
          setError("Sessão expirada. Por favor, faça o login novamente.");
          setTimeout(handleLogout, 2000); 
        } else if (err.response && err.response.status === 404) {
           // Isto vai acontecer porque /auth/me ainda não existe!
           setError("Erro 404: A rota /auth/me não foi encontrada no backend.");
        } else {
          setError("Não foi possível carregar o feed. O servidor pode estar offline.");
        }
        setLoading(false);
      }
    };

    fetchDadosIniciais();
  }, []); // O array vazio [] garante que isto corre apenas uma vez

  // --- Renderização (o que vemos na tela) ---
  return (
    <div className="flex justify-center items-start min-h-screen bg-zinc-900 text-white p-4 md:p-8">
      <div className="w-full max-w-2xl">
        
        {/* Cabeçalho com Título e Botão de Sair */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Feed Social
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Conteúdo do Feed */}
        
        {/* 1. Estado de Carregamento */}
        {loading && <p className="text-center text-zinc-400">Carregando o feed...</p>}
        
        {/* 2. Estado de Erro */}
        {error && <p className="text-center text-red-400">{error}</p>}
        
        {/* 3. Estado de Sucesso (com dados) */}
        {!loading && !error && (
          <div className="space-y-6">
            
            {/* Verifica se o feed está vazio */}
            {feed.length === 0 && (
              <div className="bg-zinc-800 p-6 rounded-xl shadow-lg text-center">
                <p className="text-zinc-400">
                  O seu feed está vazio. Adicione amigos ou complete um treino!
                </p>
              </div>
            )}

            {/* --- CORREÇÃO 3: USAR O NOVO CARDTREINO --- */}
            {/* Em vez do 'div' antigo, agora usamos o componente CardTreino.
              Passamos o 'post' (os dados do treino) e o 'usuarioAtual' 
              (para que o botão "Props" saiba quem está logado).
            */}
            {feed.map((post) => (
              <CardTreino 
                key={post.id} 
                post={post} 
                usuarioAtual={usuarioAtual} 
              />
            ))}
            {/* --- FIM DA CORREÇÃO --- */}
            
          </div>
        )}
        
      </div>
    </div>
  );
}