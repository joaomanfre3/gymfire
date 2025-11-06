from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from .config import settings
from . import schemas
from . import database
from . import models
from fastapi import Depends, HTTPException, status # Adicionado status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import bcrypt

# --- CORREÇÃO ---
# A linha 'pwd_context = CryptContext(...)' foi REMOVIDA.
# Ela vinha da biblioteca 'passlib' que desinstalámos para resolver
# o conflito de versões. Como 'passlib' já não existe,
# 'CryptContext' não está definido, o que causava o 'NameError'.
# Não precisamos mais desta linha.

# Configuração do OAuth2 (para "trancar" as rotas)
# Ele vai procurar por um "Authorization: Bearer <token>" no Header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# 1. Função para CRIAR o hash (para o registo)
def get_hash_senha(senha: str) -> str:
    """
    Cria um hash de senha usando bcrypt.
    Trunca a senha em 72 bytes para evitar o erro do bcrypt.
    """
    # Converte a string para bytes
    senha_bytes = senha.encode('utf-8')
    
    # Trunca os BYTES para 72 (limite do bcrypt)
    senha_bytes_truncada = senha_bytes[:72]
    
    # Gera o salt e cria o hash
    hash_bytes = bcrypt.hashpw(senha_bytes_truncada, bcrypt.gensalt())
    
    # Converte o hash (bytes) de volta para string para guardar no DB
    return hash_bytes.decode('utf-8')

# 2. Função para VERIFICAR o hash (para o login)
def verificar_senha(senha_plana: str, hash_senha: str) -> bool:
    """
    Verifica se a senha plana corresponde ao hash guardado.
    """
    try:
        # Converte a senha que o user digitou para bytes
        senha_plana_bytes = senha_plana.encode('utf-8')
        
        # Trunca os BYTES para 72 (Obrigatório, para ser igual ao hash)
        senha_plana_bytes_truncada = senha_plana_bytes[:72]
        
        # Converte o hash que estava no DB de volta para bytes
        hash_senha_bytes = hash_senha.encode('utf-8')
        
        # Compara os dois e retorna True ou False
        return bcrypt.checkpw(senha_plana_bytes_truncada, hash_senha_bytes)
        
    except Exception as e:
        # Se o hash for inválido, o formato estiver errado, etc.,
        # o bcrypt pode dar erro. Falha com segurança.
        print(f"Erro ao verificar senha: {e}")
        return False

# --- FUNÇÕES JWT (JÁ ESTAVAM CORRETAS) ---

def criar_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verificar_token(token: str, credentials_exception: HTTPException) -> schemas.TokenData:
    """Decodifica e valida um token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        nome_usuario: str = payload.get("sub")
        if nome_usuario is None:
            raise credentials_exception
        token_data = schemas.TokenData(nome_usuario=nome_usuario)
    except JWTError:
        raise credentials_exception
    return token_data

def get_usuario_atual(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.Usuario:
    """
    Dependência do FastAPI para "trancar" rotas.
    Verifica o token e retorna o objeto Usuario do banco.
    """
    
    from . import crud # Para evitar importação circular

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verificar_token(token, credentials_exception)
    
    usuario = crud.get_usuario_por_nome(db, nome_usuario=token_data.nome_usuario) 
    
    if usuario is None:
        raise credentials_exception
    return usuario