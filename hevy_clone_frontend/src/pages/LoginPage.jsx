import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// O caminho '../api.js' está correto, assumindo que api.js está em 'src/'
// e esta página está em 'src/pages/'.
import { api } from '../api.js'; // Importa nosso cliente de API

export default function LoginPage() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o recarregamento da página
    setError(null); // Limpa erros antigos

    const formData = new URLSearchParams();
    formData.append('username', nomeUsuario); 
    formData.append('password', senha);

    try {
      // Faz a chamada de login para /auth/token
      const response = await api.post('/auth/token', formData);
      
      // --- CORREÇÃO DE DEBUG ---
      // Adicionamos estes console.log para ver o que o backend
      // está realmente a enviar. O seu terminal (backend)
      // diz 200 OK, mas o frontend não está a redirecionar.
      // O problema é provavelmente que 'response.data.access_token' está 'undefined'.
      console.log('RESPOSTA DO BACKEND:', response.data);
      const token = response.data.access_token;
      console.log('TOKEN A SER GUARDADO:', token);
      // --- FIM DA CORREÇÃO DE DEBUG ---

      // 1. Armazena o token no localStorage do navegador
      localStorage.setItem('token', token);
      
      // 2. (Bônus) Define o token como padrão no 'api.js' para futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // 3. Redireciona o usuário para o feed
      navigate('/feed');

    } catch (err) {
      // Se der errado (status 401)
      if (err.response && err.response.status === 401) {
        setError('Nome de usuário ou senha incorretos.');
      } else {
        // Outros erros (ex: servidor offline)
        console.error("Erro no handleSubmit do Login:", err);
        setError('Erro ao conectar ao servidor. Tente novamente.');
      }
    }
  };

  return (
    // Container principal: centraliza o formulário na tela
    <div className="flex min-h-full flex-col justify-center items-center px-6 py-12 lg:px-8">
      {/* Box do formulário */}
      <div className="w-full max-w-md p-8 bg-zinc-800 rounded-xl shadow-lg">
        
        {/* Título */}
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Acesse sua conta
        </h2>

        {/* Formulário */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Campo: Nome de Usuário */}
          <div>
            <label 
              htmlFor="nome-usuario" 
              className="block text-sm font-medium leading-6 text-zinc-200"
            >
              Nome de Usuário
            </label>
            <div className="mt-2">
              <input
                id="nome-usuario"
                name="nome-usuario"
                type="text"
                required
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Campo: Senha */}
          <div>
            <label 
              htmlFor="senha" 
              className="block text-sm font-medium leading-6 text-zinc-200"
            >
              Senha
            </label>
            <div className="mt-2">
              <input
                id="senha"
                name="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exibição de Erro */}
          {error && (
            <div>
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Botão de Login */}
          <div>
            <button
              type="submit"
              className="w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Entrar
            </button>
          </div>
        </form>

        {/* Link para Registrar */}
        <p className="mt-8 text-center text-sm text-zinc-400">
          Não tem uma conta?{' '}
          <Link 
            to="/register" 
            className="font-semibold leading-6 text-blue-400 hover:text-blue-300"
          >
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  );
}