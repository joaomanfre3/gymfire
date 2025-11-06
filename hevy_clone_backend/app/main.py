# app/main.py
# (Código completo e corrigido)

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models
from .database import engine, get_db # Importa get_db e engine

# Importa os nossos ficheiros de rotas (routers)
# --- CORREÇÃO 1: IMPORTAR O NOVO ROUTER DE 'pastas' ---
from .routers import auth, exercicios, rotinas, amizades, ranking, treinos, feed, usuarios
from .routers import pastas # <- ADICIONADO

from . import crud # Precisamos disto para chamar a função de inicialização

# Esta linha cria as tabelas no DB se elas não existirem
models.Base.metadata.create_all(bind=engine)

# Cria a instância principal do FastAPI
app = FastAPI(
    title="Hevy Clone API",
    description="API para o app de academia com gamificação.",
    version="0.1.0"
)

# --- Configuração do CORS ---
origins = [
    "http://localhost:5173", # O endereço do seu 'npm run dev'
    "http://localhost:5174", # (Adicionado por segurança, caso o 5173 esteja ocupado)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- FIM DA CORREÇÃO ---

# --- CHAMAR A FUNÇÃO DE INICIALIZAÇÃO ---
# Esta função corre uma vez na inicialização da aplicação
@app.on_event("startup")
def startup_event():
    # Obtém uma sessão de banco de dados temporária
    db = next(get_db())
    # Chama a função do CRUD para garantir que a tabela 'exercicios' não está vazia
    if crud.inicializar_exercicios(db):
        print(">>> INFORMAÇÃO: Exercícios básicos inseridos no DB.")
    else:
        print(">>> INFORMAÇÃO: Tabela de exercícios já estava populada.")
    db.close()
# --- FIM DA FUNÇÃO ---


# Inclui os roteadores que criamos
app.include_router(auth.router)
app.include_router(exercicios.router)
app.include_router(rotinas.router)
app.include_router(amizades.router) # Registra as rotas de amizade
app.include_router(ranking.router) # Registra as rotas de ranking
app.include_router(treinos.router) # Registra as rotas de treino
app.include_router(feed.router) # Registra as rotas do feed social
app.include_router(usuarios.router) # Regista as rotas de busca de usuários

# --- CORREÇÃO 2: INCLUIR A NOVA ROTA DE PASTAS ---
app.include_router(pastas.router) # Regista as rotas de organização (Pastas)


@app.get("/", tags=["Root"])
def read_root():
    """ Rota raiz para verificar se a API está online. """
    return {"status": "API online e funcionando!"}