import axios from 'axios';

// 1. Cria a instância "mágica" do Axios
// Esta é a configuração central da sua API.
export const api = axios.create({
  // Define a URL base para TODAS as chamadas.
  // Agora, em vez de 'axios.post("http://127.0.0.1:8000/auth/token")',
  // você pode apenas fazer 'api.post("/auth/token")'.
  baseURL: 'http://127.0.0.1:8000', 
});

// 2. (Bónus) Interceptor para carregar o token automaticamente
// Isto lê o token do localStorage ANTES de cada chamada
// e injeta-o no cabeçalho 'Authorization'.
// Isto substitui a necessidade de definir 'api.defaults.headers' no LoginPage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);