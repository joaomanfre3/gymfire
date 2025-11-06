// src/pages/RotinasPage.jsx
// (Código completo e corrigido para implementar "Pastas")

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

// --- COMPONENTE INTERNO REUTILIZÁVEL ---
// (Para evitar duplicar o código do "Deck" / "Card da Rotina")
function RotinaCard({ rotina, onClick }) {
  return (
    <button 
      key={rotina.id} 
      onClick={onClick}
      // Estilo base para o card da rotina (Deck)
      className="w-full text-left bg-zinc-800 p-4 rounded-lg shadow-lg hover:bg-zinc-700 transition-colors"
    >
      <h3 className="text-xl font-semibold text-blue-400">📄 {rotina.nome}</h3>
      {rotina.descricao && (
        <p className="text-zinc-300 text-sm mt-1">{rotina.descricao}</p>
      )}
    </button>
  );
}
// --- FIM DO COMPONENTE INTERNO ---


export default function RotinasPage() {
  // --- CORREÇÃO 1: ESTADO ATUALIZADO ---
  const [pastas, setPastas] = useState([]);
  const [rotinasOrfas, setRotinasOrfas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastaAbertaId, setPastaAbertaId] = useState(null); // Controla o acordeão
  const navigate = useNavigate();

  // --- CORREÇÃO 2: FETCH ATUALIZADO ---
  // Busca os dois endpoints (Pastas E Rotinas Órfãs) em paralelo
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pastasResponse, rotinasResponse] = await Promise.all([
        api.get('/pastas'),  // 1. Busca Pastas (que contêm rotinas)
        api.get('/rotinas') // 2. Busca Rotinas "Órfãs" (pasta_id == null)
      ]);
      
      setPastas(pastasResponse.data);
      setRotinasOrfas(rotinasResponse.data);
      
    } catch (err) {
      console.error("Erro ao buscar dados da página de rotinas:", err);
    } finally {
      setLoading(false); // Garante que o loading termina, mesmo se der erro
    }
  };

  useEffect(() => {
    fetchData(); // Chama a função de busca
  }, []); // O array vazio [] garante que isto corre apenas uma vez

  // Navega para a página de detalhe da Rotina (Deck)
  // (Isto já estava correto)
  const handleRotinaClick = (rotinaId) => {
    navigate(`/rotinas/${rotinaId}`); 
  };

  // Abre/Fecha o "acordeão" da pasta
  const togglePasta = (pastaId) => {
    setPastaAbertaId(prevId => (prevId === pastaId ? null : pastaId));
  };
  
  // --- NOVA FUNÇÃO ---
  // Lida com a criação de uma nova pasta
  const handleCreatePasta = async () => {
    const nomePasta = prompt("Qual é o nome da nova pasta? (ex: PPL, Treino A/B)");
    
    if (nomePasta && nomePasta.trim() !== "") {
      try {
        // Chama a API que criámos no backend
        await api.post('/pastas', { nome: nomePasta });
        // Recarrega os dados da página para mostrar a nova pasta
        fetchData(); 
      } catch (err) {
        console.error("Erro ao criar pasta:", err);
        // (Numa app real, mostraríamos um toast/modal de erro)
      }
    }
  };


  return (
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        
        {/* Título da Página */}
        <h1 className="text-4xl font-bold text-white mb-8">
          Minhas Rotinas
        </h1>
        
        {loading && <p className="text-zinc-400">Carregando...</p>}
        
        {!loading && (
          // --- CORREÇÃO 3: JSX REESTRUTURADO ---
          <div className="space-y-6">
            
            {/* --- 1. SEÇÃO DE PASTAS (ACORDEÃO) --- */}
            {pastas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-zinc-300 mb-3">Pastas</h2>
                {pastas.map((pasta) => (
                  <div key={pasta.id}>
                    {/* Botão da Pasta (clicável para abrir/fechar) */}
                    <button
                      onClick={() => togglePasta(pasta.id)}
                      className="w-full text-left bg-zinc-900 p-4 rounded-lg shadow-lg hover:bg-zinc-800 transition-colors flex justify-between items-center"
                    >
                      <h3 className="text-xl font-bold text-white">
                        📁 {pasta.nome}
                      </h3>
                      <span className="text-zinc-400 text-sm">
                        {pasta.rotinas.length} {pasta.rotinas.length === 1 ? 'Deck' : 'Decks'}
                        <span className="ml-2">
                          {pastaAbertaId === pasta.id ? '▲' : '▼'}
                        </span>
                      </span>
                    </button>

                    {/* Decks (Rotinas) DENTRO da pasta (só aparece se aberta) */}
                    {pastaAbertaId === pasta.id && (
                      <div className="space-y-2 mt-2 pl-4 border-l-2 border-blue-500">
                        {pasta.rotinas.length > 0 ? (
                          pasta.rotinas.map((rotina) => (
                            <RotinaCard 
                              key={rotina.id} 
                              rotina={rotina} 
                              onClick={() => handleRotinaClick(rotina.id)} 
                            />
                          ))
                        ) : (
                          <p className="text-zinc-500 pl-4 py-2">Esta pasta está vazia.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* --- 2. SEÇÃO DE ROTINAS "ÓRFÃS" --- */}
            {rotinasOrfas.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-zinc-300 mb-3">Rotinas Avulsas</h2>
                {rotinasOrfas.map((rotina) => (
                  // Usa o mesmo Card, mas sem a indentação/borda
                  <RotinaCard 
                    key={rotina.id} 
                    rotina={rotina} 
                    onClick={() => handleRotinaClick(rotina.id)} 
                  />
                ))}
              </div>
            )}
            
            {/* --- 3. MENSAGEM DE "VAZIO" --- */}
            {/* Só mostra se não houver NADA (nem pastas, nem rotinas órfãs) */}
            {pastas.length === 0 && rotinasOrfas.length === 0 && (
              <div className="bg-zinc-800 p-6 rounded-xl shadow-lg text-center">
                <p className="text-zinc-400">
                  Você ainda não criou nenhuma rotina.
                </p>
              </div>
            )}
            
            {/* --- 4. BOTÕES DE AÇÃO --- */}
            <div className="space-y-3 pt-4">
              {/* Botão para criar nova Rotina (Deck) */}
              <Link 
                to="/rotinas/criar"
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
              >
                + Criar Nova Rotina (Deck)
              </Link>
              
              {/* Novo botão para criar Pasta */}
              <button 
                onClick={handleCreatePasta}
                className="block w-full text-center bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg"
              >
                + Criar Nova Pasta
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}