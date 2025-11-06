// src/App.jsx
// (Não quero canvas)

import { Outlet, Link, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();
  const pathname = location.pathname;

  // Não mostrar a Nav Bar no login ou registo
  const showNavBar = pathname !== '/login' && pathname !== '/register';

  return (
    // 'pb-20' garante que o conteúdo não fica atrás da Nav Bar
    <div className={`min-h-screen bg-zinc-900 text-white ${showNavBar ? 'pb-20' : ''}`}>
      
      {/* O Outlet é onde o roteador vai renderizar a página atual */}
      <Outlet />
      
      {/* Só mostra a Nav Bar se 'showNavBar' for verdadeiro */}
      {showNavBar && <NavBar />}
    </div>
  );
}

// --- Componente da Barra de Navegação ---

function NavBar() {
  const location = useLocation();
  const pathname = location.pathname;

  // Função para mudar a cor se o link estiver ativo
  const getLinkClass = (path) => {
    // Verifica se o pathname atual é igual ao path do link
    return pathname === path
      ? 'text-blue-400' // Cor Ativa
      : 'text-zinc-500 hover:text-zinc-300'; // Cor Inativa
  };

  return (
    // 'fixed' para ficar sempre visível
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-800 border-t border-zinc-700 flex justify-around items-center">
      
      {/* Link 1: Feed */}
      <Link to="/feed" className={`flex flex-col items-center transition-colors ${getLinkClass('/feed')}`}>
        {/* Ícone (Feed/Jornal) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-10.5c-.621 0-1.125-.504-1.125-1.125v-11.25c0-.621.504-1.125 1.125-1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V7.5" />
        </svg>
        <span className="text-xs font-medium">Feed</span>
      </Link>
      
      {/* Link 2: Rotinas */}
      <Link to="/rotinas" className={`flex flex-col items-center transition-colors ${getLinkClass('/rotinas')}`}>
        {/* Ícone (Rotinas/Lista) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-.665-.538-1.2-1.2-1.2H6.608c-.665 0-1.2.538-1.2 1.2v10.642c0 .665.538 1.2 1.2 1.2H18.75m-3.75 0h-3.75" />
        </svg>
        <span className="text-xs font-medium">Rotinas</span>
      </Link>

      {/* --- CORREÇÃO: BOTÃO PRINCIPAL DE AÇÃO (Começar Treino) --- */}
      {/* Este botão não tem texto para equilibrar o layout. */}
      <Link 
        to="/treino/selecionar" 
        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-xl transition-colors transform translate-y-[-15px] border-4 border-zinc-900"
      >
        {/* Ícone de Mais (+) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
      {/* --- FIM DA CORREÇÃO --- */}
      
      {/* Link 3: Ranking */}
      <Link to="/ranking" className={`flex flex-col items-center transition-colors ${getLinkClass('/ranking')}`}>
        {/* Ícone (Troféu) */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3.003 3.003 0 003-3H5.25a3.003 3.003 0 003 3m9 0v-4.5A3.003 3.003 0 0012 9.75M12 9.75A3.003 3.003 0 007.5 13.5v4.5M12 9.75h.008v.008H12V9.75z" />
        </svg>
        <span className="text-xs font-medium">Ranking</span>
      </Link>

      {/* Link 4: Placeholder para Amigos / Perfil (para manter o layout de 4 slots com o botão no centro) */}
       <Link to="/amigos" className={`flex flex-col items-center transition-colors ${getLinkClass('/amigos')}`}>
        {/* Ícone de Usuário */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0 .75.75 0 01-.439.677H4.94a.75.75 0 01-.438-.677z" />
        </svg>
        <span className="text-xs font-medium">Amigos</span>
      </Link>

    </nav>
  );
}