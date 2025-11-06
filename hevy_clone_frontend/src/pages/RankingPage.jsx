// src/pages/RankingPage.jsx
import React from 'react';

export default function RankingPage() {
  return (
    // O 'max-w-2xl mx-auto' centraliza o conteúdo
    <div className="p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
      
        {/* Título da Página */}
        <h1 className="text-4xl font-bold text-white mb-8">
          Ranking Semanal
        </h1>
        
        {/* Conteúdo (Placeholder) */}
        <div className="bg-zinc-800 p-6 rounded-xl shadow-lg text-center">
          <p className="text-zinc-400">
            A funcionalidade de ranking (com os pontos da tabela `ranking_semanal`) 
            será construída aqui.
          </p>
        </div>
        
      </div>
    </div>
  );
}