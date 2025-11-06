// src/pages/RotinaFormPage.jsx
// (Não quero canvas)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function RotinaFormPage() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!nome) {
      setError('O nome da rotina é obrigatório.');
      setLoading(false);
      return;
    }

    try {
      // 1. Chama o endpoint do backend
      const response = await api.post('/rotinas', {
        nome: nome,
        descricao: descricao
      });
      
      // 2. Se funcionar, volta para a lista de rotinas
      setLoading(false);
      navigate('/rotinas'); // <-- Volta para a lista
      
    } catch (err) {
      console.error("Erro ao criar rotina:", err);
      
      // --- CORREÇÃO DO CRASH DO REACT ---
      // O erro 422 do FastAPI envia um "detalhe" (detail) que é uma *lista* de objetos.
      // O React não sabe renderizar um objeto/lista, por isso crasha.
      // Esta correção vai extrair a *mensagem* (msg) de dentro do primeiro erro.
      if (err.response && err.response.status === 422 && err.response.data.detail) {
        // Pega a *primeira* mensagem de erro da lista de validação
        const errorMsg = err.response.data.detail[0].msg; 
        setError(errorMsg);
      } else if (err.response && err.response.data && err.response.data.detail) {
        // Erro 400, 401, 500 etc. que envia uma 'detail' string
        setError(err.response.data.detail);
      } else {
        // Outro erro qualquer (ex: rede)
        setError('Não foi possível criar a rotina. Tente novamente.');
      }
      // --- FIM DA CORREÇÃO ---
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Título da Página */}
        <div className="flex items-center space-x-4 mb-8">
          {/* Botão de Voltar */}
          <button
            onClick={() => navigate('/rotinas')} // Volta para a lista
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-white">
            Criar Nova Rotina
          </h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-800 p-6 rounded-xl shadow-lg">
          
          {/* Campo: Nome da Rotina */}
          <div>
            <label htmlFor="nome-rotina" className="block text-sm font-medium leading-6 text-zinc-200">
              Nome da Rotina
            </label>
            <div className="mt-2">
              <input
                id="nome-rotina"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                placeholder="Ex: Dia de Peito e Tríceps"
              />
            </div>
          </div>

          {/* Campo: Descrição */}
          <div>
            <label htmlFor="descricao-rotina" className="block text-sm font-medium leading-6 text-zinc-200">
              Descrição (Opcional)
            </label>
            <div className="mt-2">
              <textarea
                id="descricao-rotina"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
                placeholder="Ex: Foco em supino inclinado..."
              />
            </div>
          </div>

          {/* Exibição de Erro */}
          {error && (
            <div>
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Botão de Salvar */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Rotina'}
            </button>
          </div>
          
        </form>
        
      </div>
    </div>
  );
}