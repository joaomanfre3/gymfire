# app/routers/auth.py
# (Código completo e corrigido)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Importa os nossos módulos
# (Garante que 'models' está importado para a tipagem de 'usuario_atual')
from .. import crud, schemas, security, database, models

router = APIRouter(
    prefix="/auth", # Todas as rotas aqui começam com /auth
    tags=["Autenticação"] # Agrupa no /docs
)

# --- CORREÇÃO 1: 'UserPublic' renomeado para 'Usuario' ---
@router.post("/register", response_model=schemas.Usuario, status_code=status.HTTP_201_CREATED)
def register_user(usuario: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """
    Rota para registrar um novo usuário.
    """
    # Verifica se o email ou nome de usuário já existem
    db_user_email = crud.get_usuario_por_email(db, email=usuario.email)
    if db_user_email:
        raise HTTPException(status_code=400, detail="Email já registrado")
        
    db_user_nome = crud.get_usuario_por_nome(db, nome_usuario=usuario.nome_usuario)
    if db_user_nome:
        raise HTTPException(status_code=400, detail="Nome de usuário já registrado")
        
    # Cria o usuário (o crud.py chama o nosso novo security.get_hash_senha)
    return crud.create_usuario(db=db, usuario=usuario)


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """
    Rota de login. Recebe 'username' (que é nosso nome_usuario) e 'password'
    em um formulário (form-data).
    """
    # 1. Busca o usuário pelo nome_usuario
    usuario = crud.get_usuario_por_nome(db, nome_usuario=form_data.username)
    
    # 2. Verifica se o usuário existe e se a senha está correta
    # (Já inclui a correção para 'senha_hash')
    if not usuario or not security.verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nome de usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Cria o token de acesso (funções que já estão no nosso 'security.py')
    access_token_expires = timedelta(minutes=security.settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.criar_access_token(
        data={"sub": usuario.nome_usuario}, expires_delta=access_token_expires
    )
    
    # 4. Retorna o token para o frontend
    return {"access_token": access_token, "token_type": "bearer"}

# --- CORREÇÃO 2: 'UserPublic' renomeado para 'Usuario' ---
@router.get("/me", response_model=schemas.Usuario)
def read_users_me(
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Retorna os dados públicos do usuário logado (baseado no token).
    O 'FeedPage.jsx' chama esta rota para saber quem está logado.
    """
    # A dependência 'get_usuario_atual' já fez todo o trabalho:
    # 1. Pegou o token
    # 2. Validou o token
    # 3. Buscou o usuário no DB
    # Agora, só precisamos de o retornar.
    return usuario_atual
# --- FIM DA CORREÇÃO ---