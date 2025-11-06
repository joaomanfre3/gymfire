// src/pages/RotinaDetalhePage.jsx
// (Não quero canvas)

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

// Componente helper para formatar datas (opcional, mas limpo)
const formatarData = (dataISO) => {
  if (!dataISO) return '';
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function RotinaDetalhePage() {
  const { id: rotinaId } = useParams();
  const navigate = useNavigate();

  const [rotina, setRotina] = useState(null); // O "Deck"
  
  // --- CORREÇÃO 1: NOVO ESTADO PARA O HISTÓRICO ---
  const [historicoTreinos, setHistoricoTreinos] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iniciando, setIniciando] = useState(false); // Loading do botão "Iniciar"

  // --- CORREÇÃO 2: BUSCAR O DECK E O HISTÓRICO JUNTOS ---
  useEffect(() => {
    const fetchDadosDaRotina = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vamos buscar os dados do Deck (GET /rotinas/:id)
        // E o histórico de treinos (GET /treinos/?rotina_id=:id) em paralelo
        
        const [resRotina, resHistorico] = await Promise.all([
          api.get(`/rotinas/${rotinaId}`),
          api.get(`/treinos/por_rotina/${rotinaId}`) // <-- Rota nova (Precisamos criar no backend!)
        ]);

        setRotina(resRotina.data);
        setHistoricoTreinos(resHistorico.data);
        
      } catch (err) {
        console.error("Erro ao buscar dados da rotina:", err);
        if (err.response && err.response.status === 404) {
          setError("Rotina não encontrada.");
        } else if (err.response && err.response.status === 403) {
          setError("Você não tem permissão para ver esta rotina.");
        } else {
          // O erro mais provável agora será 404 na rota nova /treinos/por_rotina/
          setError("Erro ao carregar os dados. (A rota de histórico já existe no backend?)");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDadosDaRotina();
  }, [rotinaId]);

  // --- CORREÇÃO 3: FUNÇÃO PARA INICIAR O TREINO (COMO NO SELETOR) ---
  const handleIniciarTreino = async () => {
    setIniciando(true);
    setError(null);
    try {
      const payload = { rotina_id: parseInt(rotinaId) };
      // Chama a rota POST /treinos/iniciar (que já existe)
      const response = await api.post('/treinos/iniciar', payload);
      
      const logTreinoId = response.data.id; 
      // Redireciona para a página de treino ativo
      navigate(`/treino/ativo/${logTreinoId}`);

    } catch (err) {
      console.error("Falha ao iniciar treino:", err);
      setError("Falha ao iniciar o treino.");
    } finally {
      setIniciando(false);
    }
  };
  
  // --- Renderização ---

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">

        {/* --- Cabeçalho --- */}
        <div className="flex items-center space-x-4 mb-4">
          {/* Botão de Voltar */}
          <button
            onClick={() => navigate('/rotinas')} // Volta para a lista de "Decks"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          {loading ? (
             <h1 className="text-4xl font-bold text-white">Carregando Deck...</h1>
          ) : (
             <h1 className="text-4xl font-bold text-white">
              {rotina ? rotina.nome : 'Rotina'}
             </h1>
          )}
        </div>
        
        {/* Descrição do Deck */}
        {rotina && rotina.descricao && (
          <p className="text-zinc-300 mb-8 ml-10">{rotina.descricao}</p>
        )}

        {/* --- CORREÇÃO 4: BOTÃO DE AÇÃO PRINCIPAL --- */}
        {/* O botão de "+ Adicionar Exercício" foi substituído */}
        {!loading && !error && (
            <div className="mb-8">
                <button 
                  onClick={handleIniciarTreino}
                  disabled={iniciando}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50"
                >
                  {iniciando ? 'Iniciando...' : '💪 Iniciar Treino com este Deck'}
                </button>
                {/* TODO: Adicionar um botão "Editar Deck" (para adicionar/remover exercícios) */}
            </div>
        )}

        {/* --- Conteúdo da Página (Histórico de Treinos) --- */}
        
        {/* 1. Estado de Carregamento */}
        {loading && <p className="text-zinc-400 text-center">Carregando histórico...</p>}

        {/* 2. Estado de Erro */}
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        {/* 3. Estado de Sucesso (com dados) */}
        {!loading && !error && (
          <div className="space-y-4">
            
            <h2 className="text-2xl font-semibold text-white">Histórico de Treinos</h2>
            
            {historicoTreinos.length === 0 ? (
              <div className="bg-zinc-800 p-6 rounded-xl shadow-lg text-center">
                <p className="text-zinc-400">
                  Você ainda não registou nenhum treino com este Deck.
                </p>
              </div>
            ) : (
              // Lista o histórico de treinos feitos com este "Deck"
              historicoTreinos.map((treino) => (
                <div key={treino.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center shadow-lg">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Treino de {formatarData(treino.data_fim)}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {treino.series.length} séries registadas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-400">
                      {treino.pontos_esforco_total}
                    </p>
                    <p className="text-xs text-zinc-400">Pontos</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}