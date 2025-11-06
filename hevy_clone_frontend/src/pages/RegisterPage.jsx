import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api.js'

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 1. Validação simples no frontend
    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (senha.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    try {
      // 2. Prepara os dados para o backend
      // O endpoint /auth/register espera um JSON (schemas.UserCreate)
      const payload = {
        email: email,
        nome_usuario: nomeUsuario,
        senha: senha,
      };

      // 3. Faz a chamada de registro para /auth/register
      await api.post('/auth/register', payload);

      // 4. Se der certo (status 201)
      setSuccess('Conta criada com sucesso! Redirecionando para o login...');
      
      // Espera 2 segundos e redireciona para o login
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      // 5. Se der errado (erro 400 do backend)
      if (err.response && err.response.data && err.response.data.detail) {
        // Mostra o erro exato do backend (ex: "Email já registrado")
        setError(err.response.data.detail);
      } else {
        // Outros erros (ex: servidor offline)
        console.error(err);
        setError('Erro ao conectar ao servidor. Tente novamente.');
      }
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center items-center px-6 py-12 lg:px-8">
      <div className="w-full max-w-md p-8 bg-zinc-800 rounded-xl shadow-lg">
        
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Crie sua conta
        </h2>

        {/* Formulário de Registro */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          
          {/* Campo: Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium leading-6 text-zinc-200"
            >
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              />
            </div>
          </div>

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
                autoComplete="username"
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
          
          {/* Campo: Confirmar Senha */}
          <div>
            <label 
              htmlFor="confirmar-senha" 
              className="block text-sm font-medium leading-6 text-zinc-200"
            >
              Confirmar Senha
            </label>
            <div className="mt-2">
              <input
                id="confirmar-senha"
                name="confirmar-senha"
                type="password"
                required
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full rounded-md border-0 bg-zinc-700 p-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-600 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exibição de Erro (vermelho) ou Sucesso (verde) */}
          {error && (
            <div>
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}
          {success && (
            <div>
              <p className="text-sm text-green-400 text-center">{success}</p>
            </div>
          )}

          {/* Botão de Registrar */}
          <div>
            <button
              type="submit"
              className="w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              Criar conta
            </button>
          </div>
        </form>

        {/* Link para Login */}
        <p className="mt-8 text-center text-sm text-zinc-400">
          Já tem uma conta?{' '}
          <Link 
            to="/login" 
            className="font-semibold leading-6 text-blue-400 hover:text-blue-300"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}