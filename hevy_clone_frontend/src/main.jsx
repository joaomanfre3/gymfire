// src/main.jsx
// (Não quero canvas)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Importa nossas páginas
import LoginPage from './pages/LoginPage.jsx'; 
import RegisterPage from './pages/RegisterPage.jsx';
import FeedPage from './pages/FeedPage.jsx'; 
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RotinasPage from './pages/RotinasPage.jsx';
import RankingPage from './pages/RankingPage.jsx'; 
import RotinaFormPage from './pages/RotinaFormPage.jsx';
import RotinaDetalhePage from './pages/RotinaDetalhePage.jsx';
import TreinoSeletorPage from './pages/TreinoSeletorPage.jsx';
import TreinoAtivoPage from './pages/TreinoAtivoPage.jsx';

// --- CORREÇÃO: IMPORTAR A NOVA PÁGINA DE AMIGOS ---
import AmigosPage from './pages/AmigosPage.jsx';


// Define as rotas (URLs) da nossa aplicação
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App.jsx é o layout principal (com a Nav Bar)
    children: [
      
      // --- Rotas Públicas ---
      {
        path: "login", 
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },

      // --- Rotas Protegidas ---
      {
        element: <ProtectedRoute />, // O "Porteiro"
        children: [
          {
            path: "feed", 
            element: <FeedPage />,
          },
          
          // --- ROTAS DE ROTINA ---
          {
            path: "rotinas",
            element: <RotinasPage />,
          },
          {
            path: "rotinas/criar", // Formulário de criação
            element: <RotinaFormPage />,
          },
          {
            path: "rotinas/:id", // Detalhe da Rotina
            element: <RotinaDetalhePage />,
          },
          
          // --- ROTAS DE TREINO ---
          {
            path: "treino/selecionar", // Rota que o botão '+' usa
            element: <TreinoSeletorPage />,
          },
          {
            path: "treino/ativo/:logTreinoId", 
            element: <TreinoAtivoPage />,
          },
          
          {
            path: "ranking",
            element: <RankingPage />,
          },
          
          // --- CORREÇÃO: REGISTAR A ROTA DE AMIGOS ---
          {
            path: "amigos",
            element: <AmigosPage />,
          },
          // --- FIM DA CORREÇÃO ---
        ]
      },
      
      // --- Redirecionamento da Raiz ---
      {
        path: "/",
        element: <Navigate to="/feed" replace />
      }
    ],
  },
]);

// Inicializa a aplicação com o roteador
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)