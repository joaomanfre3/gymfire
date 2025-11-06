// src/pages/AmigosPage.jsx
// (Não quero canvas)

import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function AmigosPage() {
  const [amigos, setAmigos] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para a Busca de Novos Amigos ---
  const [termoBusca, setTermoBusca] = useState('');
  // --- CORREÇÃO 1: O resultado da busca agora é uma LISTA (array) ---
  const [resultadoBusca, setResultadoBusca] = useState([]); // Armazena os usuários encontrados
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [errorBusca, setErrorBusca] = useState(null);

  // --- Função para buscar amigos e solicitações ---
  const fetchDadosAmigos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca a lista de amigos (GET /amigos)
      const resAmigos = await api.get('/amigos');
      setAmigos(resAmigos.data);
      
      // Busca solicitações pendentes (GET /amigos/solicitacoes/pendentes)
      const resSolicitacoes = await api.get('/amigos/solicitacoes/pendentes');
      setSolicitacoes(resSolicitacoes.data);
      
    } catch (err) {
      console.error("Erro ao buscar dados de amigos:", err);
      setError("Não foi possível carregar os dados. Tente atualizar a página.");
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados quando a página carrega
  useEffect(() => {
    fetchDadosAmigos();
  }, []);

  // --- Funções de Ação ---

  // Aceitar uma solicitação de amizade
  const handleAceitar = async (solicitacaoId) => {
    try {
      // Chama a rota POST /amigos/aceitar/{id}
      await api.post(`/amigos/aceitar/${solicitacaoId}`);
      // Recarrega os dados (move da lista de pendentes para a lista de amigos)
      fetchDadosAmigos(); 
    } catch (err) {
      console.error("Erro ao aceitar:", err);
      alert("Erro ao aceitar solicitação.");
    }
  };

  // Recusar uma solicitação de amizade
  const handleRecusar = async (solicitacaoId) => {
    try {
      // Chama a rota POST /amigos/recusar/{id}
      await api.post(`/amigos/recusar/${solicitacaoId}`);
      // Apenas remove da lista de pendentes
      setSolicitacoes(prev => prev.filter(s => s.id !== solicitacaoId));
    } catch (err) {
      console.error("Erro ao recusar:", err);
      alert("Erro ao recusar solicitação.");
    }
  };

  // --- CORREÇÃO 2: ATUALIZAR A FUNÇÃO DE BUSCA ---
  // Buscar um usuário pelo nome
  const handleBuscarAmigo = async (e) => {
    e.preventDefault();
    // O backend (usuarios.py) exige pelo menos 2 caracteres
    if (termoBusca.trim().length < 2) {
        setErrorBusca("Digite pelo menos 2 caracteres para buscar.");
        return;
    }
    
    setLoadingBusca(true);
    setErrorBusca(null);
    setResultadoBusca([]); // Limpa resultados antigos
    
    try {
      // Substituído o placeholder '/auth/me' pela rota real
      // que criámos no backend (app/routers/usuarios.py)
      const response = await api.get(`/usuarios/buscar/${termoBusca}`);
      
      // A API retorna uma lista (Array)
      if (response.data && response.data.length > 0) {
        setResultadoBusca(response.data); // Salva a lista de resultados
      } else {
        setResultadoBusca([]); // Salva uma lista vazia
        setErrorBusca("Nenhum usuário encontrado.");
      }
      
    } catch (err) {
      console.error("Erro ao buscar usuário:", err);
      setErrorBusca(err.response?.data?.detail || "Erro ao buscar usuário.");
    } finally {
      setLoadingBusca(false);
    }
  };
  
  // Enviar uma solicitação de amizade
  const handleEnviarSolicitacao = async (receptorId) => {
      try {
        await api.post(`/amigos/solicitar/${receptorId}`);
        alert("Solicitação enviada!");
        // Remove o usuário da lista de busca após ser adicionado
        setResultadoBusca(prev => prev.filter(u => u.id !== receptorId));
        setTermoBusca('');
      } catch(err) {
          // Mostra o erro do backend (ex: "Já existe uma solicitação")
          setErrorBusca(err.response?.data?.detail || "Erro ao enviar solicitação.");
      }
  };
  // --- FIM DAS CORREÇÕES ---


  // --- Renderização ---

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto space-y-10">
        
        {/* Título da Página */}
        <h1 className="text-4xl font-bold text-white">
          Amigos
        </h1>
        
        {loading && <p className="text-zinc-400 text-center">Carregando...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        {!loading && !error && (
          <>
            {/* --- 1. Adicionar Amigo (Busca) --- */}
            <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">Adicionar Amigo</h2>
              <form onSubmit={handleBuscarAmigo} className="flex space-x-2">
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar por nome de usuário..."
                  className="flex-1 rounded-md border-0 bg-zinc-700 p-2.5 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loadingBusca}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingBusca ? '...' : 'Buscar'}
                </button>
              </form>
              
              {/* Resultado da Busca */}
              {errorBusca && <p className="text-red-400 text-center mt-3">{errorBusca}</p>}
              
              {/* --- CORREÇÃO 3: FAZER UM .MAP() NOS RESULTADOS --- */}
              {/* A busca agora mostra uma lista de resultados */}
              {resultadoBusca.length > 0 && (
                <div className="mt-4 space-y-2">
                  {resultadoBusca.map(usuario => (
                    <div key={usuario.id} className="bg-zinc-700 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-white">{usuario.nome_usuario}</span>
                      <button 
                        onClick={() => handleEnviarSolicitacao(usuario.id)}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-2 rounded-md"
                      >
                        + Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* --- FIM DA CORREÇÃO --- */}
            </div>

            {/* --- 2. Solicitações Pendentes --- */}
            {solicitacoes.length > 0 && (
              <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-white mb-4">Solicitações Pendentes</h2>
                <div className="space-y-3">
                  {solicitacoes.map(sol => (
                    <div key={sol.id} className="bg-zinc-700 p-3 rounded-lg flex justify-between items-center">
                      <p className="text-white">{sol.solicitante.nome_usuario}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAceitar(sol.id)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-md text-sm"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => handleRecusar(sol.id)}
                          className="bg-zinc-600 hover:bg-zinc-500 text-white font-bold py-1 px-3 rounded-md text-sm"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* --- 3. Lista de Amigos --- */}
            <div className="bg-zinc-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">Meus Amigos ({amigos.length})</h2>
              {amigos.length === 0 ? (
                <p className="text-zinc-400">Você ainda não tem amigos. Use a busca acima!</p>
              ) : (
                <div className="space-y-3">
                  {amigos.map(amigo => (
                    <div key={amigo.id} className="bg-zinc-700 p-3 rounded-lg flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: amigo.cor_perfil || '#1E88E5' }}
                      >
                        {amigo.emoji_avatar || '💪'}
                      </div>
                      <span className="text-white font-semibold">{amigo.nome_usuario}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </>
        )}
      </div>
    </div>
  );
}