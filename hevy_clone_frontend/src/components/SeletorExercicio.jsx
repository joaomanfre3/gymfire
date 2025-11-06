// src/components/SeletorExercicio.jsx
// (Não quero canvas)

import { useState, useEffect } from 'react';
import { api } from '../api.js';

/**
 * Este é o Modal (pop-up) que mostra a lista de todos os exercícios
 * (as "Cartas") que o usuário pode adicionar ao "Deck" (Rotina).
 *
 * Props que ele recebe:
 * - isOpen: (boolean) Controla se o modal está visível ou não.
 * - onClose: (função) O que fazer quando o usuário clica em "Cancelar".
 * - onExercicioSelect: (função) O que fazer quando o usuário ESCOLHE um exercício.
 */
export default function SeletorExercicio({ isOpen, onClose, onExercicioSelect }) {
  const [exercicios, setExercicios] = useState([]); // Lista completa de exercícios (cache)
  const [filtro, setFiltro] = useState(''); // O texto da barra de busca
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Busca todos os exercícios do backend (GET /exercicios)
  useEffect(() => {
    // Só busca se o modal estiver aberto E se a lista estiver vazia (para não buscar 10x)
    if (isOpen && exercicios.length === 0) {
      setLoading(true);
      
      const fetchExercicios = async () => {
        try {
          // Esta rota vem do seu 'crud.py' (get_exercicios)
          const response = await api.get('/exercicios');
          setExercicios(response.data);
          setError(null);
        } catch (err) {
          console.error("Erro ao buscar exercícios:", err);
          setError("Falha ao carregar a lista de exercícios.");
        }
        setLoading(false);
      };
      
      fetchExercicios();
    }
  }, [isOpen, exercicios.length]); // Dependências: Roda se 'isOpen' mudar

  // 2. Filtra a lista de exercícios com base na busca do usuário
  const exerciciosFiltrados = exercicios.filter(ex => 
    // Procura no nome (ex: "Supino Reto")
    ex.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    // Procura no grupo (ex: "Peito")
    ex.grupo_muscular.toLowerCase().includes(filtro.toLowerCase())
  );

  // 3. O que acontece quando o usuário clica num exercício
  const handleSelect = (exercicioId) => {
    // Chama a função que o "pai" (RotinaDetalhePage) passou via props,
    // enviando o ID da "Carta" (exercício) selecionada.
    onExercicioSelect(exercicioId);
  };

  // Se o modal não estiver aberto (isOpen=false), não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Se estiver aberto, renderiza o modal
  return (
    // Overlay (o fundo escuro que cobre a página)
    <div 
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4"
      onClick={onClose} // Clicar no fundo fecha o modal
    >
      
      {/* O conteúdo do Modal (o pop-up em si) */}
      {/* O e.stopPropagation() impede que clicar no modal feche o modal */}
      <div 
        className="bg-zinc-800 rounded-xl shadow-lg w-full max-w-md flex flex-col" 
        style={{ maxHeight: '80vh' }} // Limita a altura em telas pequenas
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Cabeçalho */}
        <div className="p-4 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-white">Adicionar Exercício</h2>
          <p className="text-sm text-zinc-400">Selecione uma "Carta" para o seu "Deck"</p>
        </div>

        {/* Barra de Busca */}
        <div className="p-4 border-b border-zinc-700">
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome ou grupo (ex: Peito)"
            className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lista (com scroll) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-zinc-400 text-center">Carregando exercícios...</p>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          
          {!loading && !error && exerciciosFiltrados.length === 0 && (
            <p className="text-zinc-400 text-center">Nenhum exercício encontrado.</p>
          )}
          
          {/* Mapeia e mostra os exercícios filtrados */}
          {!loading && !error && exerciciosFiltrados.map(ex => (
            <button
              key={ex.id}
              onClick={() => handleSelect(ex.id)} // Chama a função de seleção
              className="w-full text-left bg-zinc-700 p-3 rounded-lg hover:bg-zinc-600 transition-colors"
            >
              <p className="text-lg font-semibold text-white">{ex.nome}</p>
              <p className="text-sm text-blue-400">{ex.grupo_muscular}</p>
            </button>
          ))}
        </div>

        {/* Rodapé (Botão de Fechar) */}
        <div className="p-4 border-t border-zinc-700">
          <button
            onClick={onClose} // Chama a função de fechar (passada via props)
            className="w-full bg-zinc-600 hover:bg-zinc-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
        
      </div>
    </div>
  );
}