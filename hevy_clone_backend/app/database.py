from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Cria a "engine" de conexão usando a URL do arquivo de config
engine = create_engine(settings.DATABASE_URL)

# Cria uma "fábrica" de sessões para conversar com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para nossos modelos (tabelas)
Base = declarative_base()

def get_db():
    """
    Função "Dependency" do FastAPI.
    Garante que a sessão com o banco seja aberta e fechada
    corretamente para cada requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

