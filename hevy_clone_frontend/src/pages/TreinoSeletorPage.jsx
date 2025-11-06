// src/pages/TreinoSeletorPage.jsx
// (Não quero canvas)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function TreinoSeletorPage() {
  const [rotinas, setRotinas] = useState([]);
  const [rotinaSelecionada, setRotinaSelecionada] = useState(null); // ID da rotina para o treino
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iniciando, setIniciando] = useState(false); // Estado para o loading do POST
  const navigate = useNavigate();

  // 1. Busca todas as rotinas disponíveis (Decks)
  useEffect(() => {
    const fetchRotinas = async () => {
      try {
        const response = await api.get('/rotinas');
        setRotinas(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar rotinas:", err);
        setError("Não foi possível carregar seus Decks de treino.");
        setLoading(false);
      }
    };
    fetchRotinas();
  }, []);

  // 2. Função para Iniciar o Treino
  const handleIniciarTreino = async () => {
    setError(null);
    setIniciando(true);
    
    // Pega o ID da rotina, se alguma foi selecionada.
    const rotinaId = rotinaSelecionada;

    try {
      // Cria o payload: envia a rotina_id se existir, senão envia null.
      const payload = {
        rotina_id: rotinaId,
      };

      // 3. Chama a rota POST /treinos/iniciar (que vamos criar a seguir)
      const response = await api.post('/treinos/iniciar', payload);
      
      // O backend deve retornar o LogTreino criado, que contém o ID.
      const logTreinoId = response.data.id; 

      // 4. Redireciona para a página de treino ativo (que vamos criar)
      navigate(`/treino/ativo/${logTreinoId}`);

    } catch (err) {
      console.error("Falha ao iniciar treino:", err);
      setError("Falha ao iniciar o treino. Tente novamente.");
    } finally {
      setIniciando(false);
    }
  };


  // --- Renderização ---
  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Título da Página */}
        <div className="flex items-center space-x-4 mb-8">
          <h1 className="text-4xl font-bold text-white">
            Qual treino vamos fazer?
          </h1>
        </div>

        {/* Mensagens de estado */}
        {loading && <p className="text-zinc-400 text-center">Carregando seus Decks...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        
        {/* Lista de Rotinas (Decks) */}
        {!loading && !error && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-zinc-300">Escolha o seu Deck:</h2>
            
            {rotinas.length === 0 ? (
              <div className="bg-zinc-800 p-6 rounded-xl shadow-lg text-center">
                <p className="text-zinc-400">
                  Crie uma rotina primeiro para aparecer aqui.
                </p>
                {/* Link para criar rotina (Deck) */}
                <button
                  onClick={() => navigate('/rotinas/criar')}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Criar Novo Deck
                </button>
              </div>
            ) : (
              // Mapeia os Decks (Rotinas)
              rotinas.map((rotina) => (
                <div
                  key={rotina.id} 
                  onClick={() => setRotinaSelecionada(rotina.id)}
                  className={`
                    bg-zinc-800 p-4 rounded-lg shadow-lg cursor-pointer transition-all
                    ${rotinaSelecionada === rotina.id 
                       ? 'ring-4 ring-blue-500' // Deck selecionado
                       : 'hover:bg-zinc-700' // Deck não selecionado
                    }
                  `}
                >
                  <h3 className="text-xl font-semibold text-white">{rotina.nome}</h3>
                  <p className="text-zinc-400 text-sm">{rotina.descricao || 'Sem descrição.'}</p>
                  {/* Se o Deck estiver vazio, avisa o usuário */}
                  {rotina.exercicios_rotina.length === 0 && (
                      <p className="text-sm text-red-400 mt-1">⚠️ Deck Vazio (adicione exercícios primeiro)</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Botão de Ação Principal (Flutuante) */}
        <div className="fixed bottom-20 left-0 right-0 p-4">
            <div className="w-full max-w-2xl mx-auto">
                <button
                  onClick={handleIniciarTreino}
                  disabled={iniciando || loading || rotinas.length === 0}
                  className="w-full justify-center rounded-xl bg-blue-600 px-3 py-4 text-lg font-semibold leading-6 text-white shadow-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {iniciando ? 'Iniciando Treino...' : '💪 Começar Treino!'}
                </button>
            </div>
        </div>
        
      </div>
    </div>
  );
}