import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // 1. Verifica se existe um 'token' no localStorage
  const token = localStorage.getItem('token');

  // 2. Se NÃO houver token, redireciona o usuário para a página de login
  if (!token) {
    // O 'replace' impede que o usuário volte para a página anterior (o feed)
    return <Navigate to="/login" replace />;
  }

  // 3. Se houver um token, renderiza o <Outlet />
  // O <Outlet /> vai renderizar a página filha (no caso, o FeedPage)
  return <Outlet />;
};

export default ProtectedRoute;