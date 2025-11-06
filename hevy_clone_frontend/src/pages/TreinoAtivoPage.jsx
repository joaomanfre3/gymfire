// src/pages/TreinoAtivoPage.jsx
// (Não quero canvas)

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

// --- CORREÇÃO 1: Importar o Seletor de Exercícios ---
import SeletorExercicio from '../components/SeletorExercicio.jsx';

// Tempo de espera (ms) para que o usuário veja a mensagem de sucesso
const TEMPO_SUCESSO = 1500;

export default function TreinoAtivoPage() {
  const { logTreinoId } = useParams(); // ID do LogTreino vindo do URL
  const navigate = useNavigate();

  // --- Estados do Treino ---
  const [logTreino, setLogTreino] = useState(null); // Dados do LogTreino (o "pai")
  const [series, setSeries] = useState([]); // Todas as séries já feitas neste treino
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(''); // Mensagem de sucesso/erro
  
  // --- Estados da Série Ativa ---
  // (Estes estados são compartilhados pelos formulários de adicionar série)
  const [peso, setPeso] = useState('');
  const [repeticoes, setRepeticoes] = useState('');
  const [adicionandoSerie, setAdicionandoSerie] = useState(false);
  const pesoRef = useRef(null); // Ref para focar no campo de peso
  
  // --- CORREÇÃO 2: Estado do Modal ---
  const [isSeletorOpen, setIsSeletorOpen] = useState(false);

  // --- CORREÇÃO 3: Lógica para exibir exercícios ---
  // A lista de exercícios a mostrar é a união dos exercícios da Rotina ("Deck")
  // E dos exercícios que já têm séries logadas ("Cartas" jogadas).
  const exerciciosVisiveis = useMemo(() => {
    if (!logTreino) return [];
    
    // 1. Exercícios do "Deck" (Rotina)
    const rotinaExs = logTreino.rotina?.exercicios_rotina.map(item => item.exercicio) || [];
    
    // 2. Exercícios das séries já feitas (que podem não estar no Deck)
    const seriesExs = series.map(s => s.exercicio);
    
    // 3. Junta e remove duplicados
    const todosExs = [...rotinaExs, ...seriesExs];
    const unicos = new Map();
    todosExs.forEach(ex => { if(ex) unicos.set(ex.id, ex); });

    // 4. Ordena pela ordem da rotina (se existir), senão joga para o fim
    return Array.from(unicos.values()).sort((a, b) => {
        const ordemA = logTreino.rotina?.exercicios_rotina.find(item => item.exercicio.id === a.id)?.ordem || 999;
        const ordemB = logTreino.rotina?.exercicios_rotina.find(item => item.exercicio.id === b.id)?.ordem || 999;
        return ordemA - ordemB;
    });
  }, [logTreino, series]); // Recalcula se o logTreino ou as series mudarem
  // --- FIM DA CORREÇÃO 3 ---


  // --- Funções do Treino ---

  // Função para buscar o treino (LogTreino) e todas as suas séries
  const fetchTreino = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get(`/treinos/${logTreinoId}`);
      
      setLogTreino(response.data);
      setSeries(response.data.series.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); 
      
      if (response.data.data_fim) {
        navigate('/feed'); 
        return;
      }
    } catch (err) {
      console.error("Erro ao carregar treino:", err);
      setError("Não foi possível carregar o treino ativo.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreino();
  }, [logTreinoId]);
  
  useEffect(() => {
    if (!loading && pesoRef.current) {
        pesoRef.current.focus();
    }
  }, [loading]);


  // --- Função para ADICIONAR uma Série ---
  const handleAdicionarSerie = async (exercicioId) => {
    setError(null);
    if (!peso || !repeticoes || isNaN(parseFloat(peso)) || isNaN(parseInt(repeticoes))) {
      setError("Por favor, insira um peso e repetições válidos.");
      return;
    }
    
    setAdicionandoSerie(true);

    try {
      const payload = {
        log_treino_id: parseInt(logTreinoId),
        exercicio_id: exercicioId,
        peso: parseFloat(peso),
        repeticoes: parseInt(repeticoes),
      };

      const response = await api.post('/treinos/adicionar_serie', payload);
      
      setStatusMessage("Série salva! 💪");
      setSeries(prevSeries => [response.data, ...prevSeries]); // Adiciona a nova série
      setPeso('');
      setRepeticoes('');
      
      setTimeout(() => { 
        setStatusMessage('');
        if (pesoRef.current) pesoRef.current.focus();
      }, TEMPO_SUCESSO);

    } catch (err) {
      console.error("Falha ao adicionar série:", err);
      setError("Falha ao salvar a série.");
    } finally {
      setAdicionandoSerie(false);
    }
  };

  // --- CORREÇÃO 4: FUNÇÃO PARA ADICIONAR UM NOVO EXERCÍCIO AO TREINO ---
  const handleExercicioSelect = async (exercicioId) => {
    setIsSeletorOpen(false); // Fecha o modal
    setError(null);
    setAdicionandoSerie(true); // Reusa o estado de loading

    try {
      // 1. Verifica se este exercício (Carta) já está no treino
      if (exerciciosVisiveis.some(ex => ex.id === exercicioId)) {
        setError("Este exercício já está no seu treino.");
        setTimeout(() => setError(null), TEMPO_SUCESSO);
        return;
      }
      
      // 2. Adiciona uma "série inicial" de 0kg x 0reps
      //    Isto força o exercício a aparecer na UI (pela lógica do 'exerciciosVisiveis')
      const payload = {
        log_treino_id: parseInt(logTreinoId),
        exercicio_id: exercicioId,
        peso: 0,
        repeticoes: 0,
      };
      
      // 3. Chama a rota POST /treinos/adicionar_serie
      const response = await api.post('/treinos/adicionar_serie', payload);
      
      // 4. Adiciona a nova série (de 0x0) à lista local
      // O 'exercicio' aninhado vem do response (schemas.LogSeriePublic)
      setSeries(prevSeries => [response.data, ...prevSeries]);
      
      // (O 'useMemo' vai detetar a mudança em 'series' e
      //  automaticamente adicionar o novo card de exercício à tela)

    } catch (err) {
       console.error("Falha ao adicionar exercício ao treino:", err);
       setError("Falha ao adicionar exercício.");
    } finally {
      setAdicionandoSerie(false);
    }
  };
  
  // --- Função para FINALIZAR o Treino ---
  const handleFinalizarTreino = async () => {
    // A lógica de 'confirm' é má num 'alert'. Vamos mudar isto no futuro.
    if (window.confirm("Tem certeza que deseja finalizar este treino?")) {
      setError(null);
      setAdicionandoSerie(true); 
      
      try {
        const payload = { data_fim: new Date().toISOString() };
        await api.post(`/treinos/${logTreinoId}/finalizar`, payload);
        
        setStatusMessage("Treino Finalizado! Seus pontos foram adicionados ao ranking.");
        
        setTimeout(() => navigate('/feed'), TEMPO_SUCESSO * 1.5);
        
      } catch (err) {
        console.error("Falha ao finalizar treino:", err);
        setError("Falha ao finalizar o treino.");
      } finally {
        setAdicionandoSerie(false);
      }
    }
  };
  
  // --- Renderização ---
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
        <p>Carregando treino...</p>
      </div>
    );
  }
  
  if (error && !logTreino) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate('/feed')} className="mt-4 text-blue-400">Voltar para o Feed</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-zinc-900 min-h-screen text-white">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Título do Treino */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">
            {logTreino?.rotina?.nome || "Treino Rápido"}
          </h1>
          
          <button 
            onClick={handleFinalizarTreino}
            disabled={adicionandoSerie}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Finalizar
          </button>
        </div>

        {/* Mensagens de Status */}
        {statusMessage && (
          <div className="bg-green-600/30 text-green-400 p-3 rounded-lg mb-4 text-center">
            {statusMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-600/30 text-red-400 p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* --- CORREÇÃO 5: Mapear 'exerciciosVisiveis' --- */}
        <div className="space-y-6">
          
          {exerciciosVisiveis.length === 0 && (
              <div className="bg-zinc-800 p-4 rounded-xl text-center">
                <p className="text-zinc-400">
                  Treino vazio. Clique abaixo para adicionar seu primeiro exercício.
                </p>
              </div>
          )}

          {/* Mapeia os exercícios (da rotina + adicionados agora) */}
          {exerciciosVisiveis.map((exercicio, index) => {
            // Obtém as séries já feitas deste exercício (as mais recentes no topo)
            const seriesDoExercicio = series.filter(s => s.exercicio_id === exercicio.id);
            
            return (
              <div key={exercicio.id} className="bg-zinc-800 p-4 rounded-xl shadow-lg border-l-4 border-blue-500">
                
                <h3 className="text-xl font-semibold mb-3">
                  {index + 1}. {exercicio.nome}
                </h3>
                
                {/* Histórico de Séries Feitas */}
                <div className="space-y-1 mb-3">
                    {seriesDoExercicio.map((s, idx) => (
                        <div key={s.id} className={`flex justify-between items-center p-2 rounded-md ${s.e_recorde_peso || s.e_recorde_reps ? 'bg-yellow-800/50' : 'bg-zinc-700'}`}>
                            <span className="font-medium text-zinc-300">Série {seriesDoExercicio.length - idx}</span>
                            <span className="text-white font-bold">
                                {s.repeticoes} x {s.peso} kg
                            </span>
                            {(s.e_recorde_peso || s.e_recorde_reps) && (
                                <span className="text-xs text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded-full">PR!</span>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Formulário de Adicionar Série */}
                <div className="flex space-x-2 mt-4">
                  <input
                    ref={index === 0 ? pesoRef : null} // Foca no campo do *primeiro* exercício
                    type="number"
                    step="0.5"
                    placeholder="Peso (kg)"
                    // O 'id' único garante que o React não reutiliza o estado de outro input
                    id={`peso-${exercicio.id}`} 
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-1/3 rounded-md bg-zinc-700 p-2 text-white placeholder-zinc-400 text-center"
                    disabled={adicionandoSerie}
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    id={`reps-${exercicio.id}`}
                    onChange={(e) => setRepeticoes(e.target.value)}
                    className="w-1/3 rounded-md bg-zinc-700 p-2 text-white placeholder-zinc-400 text-center"
                    disabled={adicionandoSerie}
                  />
                  <button
                    onClick={() => handleAdicionarSerie(exercicio.id)}
                    disabled={adicionandoSerie} // O botão só é habilitado se 'peso' e 'reps' tiverem valor no CSS (via :disabled)
                    className="w-1/3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
                  >
                    {adicionandoSerie ? '...' : '+ Salvar'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* --- CORREÇÃO 6: BOTÃO PARA ADICIONAR EXERCÍCIO (TREINO RÁPIDO) --- */}
          <button 
            onClick={() => setIsSeletorOpen(true)} // Abre o modal
            disabled={adicionandoSerie}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-blue-400 font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50"
          >
            + Adicionar Exercício (Treino Rápido)
          </button>
          
        </div>
      </div>
      
      {/* --- CORREÇÃO 7: O MODAL --- */}
      <SeletorExercicio
        isOpen={isSeletorOpen}
        onClose={() => setIsSeletorOpen(false)}
        onExercicioSelect={handleExercicioSelect} // Chama a nova função
      />
      
    </div>
  );
}