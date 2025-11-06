# app/schemas.py
# (Corrigido com 'from_attributes = True' para Pydantic V2)

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

# --- CORREÇÃO Pydantic V2 ---
# Esta é a configuração que substitui 'orm_mode = True'
orm_config = ConfigDict(from_attributes=True)

# ---------------------------------
# Schemas de Exercício (Cartas)
# ---------------------------------
class ExercicioBase(BaseModel):
    nome: str
    grupo_muscular: str

class Exercicio(ExercicioBase):
    id: int
    model_config = orm_config


# ---------------------------------
# Schemas de RotinaExercicio (Associação)
# ---------------------------------
class ExercicioRotinaCreate(BaseModel):
    exercicio_id: int
    ordem: int = 0

class RotinaExercicioPublic(ExercicioRotinaCreate):
    id: int
    rotina_id: int
    exercicio: Exercicio 
    model_config = orm_config

# ---------------------------------
# Schemas de Rotina (Decks)
# ---------------------------------
class RotinaBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class RotinaCreate(RotinaBase):
    pasta_id: Optional[int] = None 

class Rotina(RotinaBase):
    id: int
    usuario_id: int
    data_criacao: datetime
    pasta_id: Optional[int] = None 
    exercicios: List[RotinaExercicioPublic] = []
    model_config = orm_config

# ---------------------------------
# Schemas de Pasta (Organização)
# ---------------------------------
class PastaBase(BaseModel):
    nome: str

class PastaCreate(PastaBase):
    pass

class PastaUpdate(PastaBase):
    pass

class Pasta(PastaBase):
    id: int
    usuario_id: int
    rotinas: List[Rotina] = [] 
    model_config = orm_config

# ---------------------------------
# Schemas de LogSerie (Séries do Treino)
# ---------------------------------
class LogSerieBase(BaseModel):
    exercicio_id: int
    peso: float
    repeticoes: int

class LogSerieCreate(LogSerieBase):
    log_treino_id: int 

class LogSerie(LogSerieBase):
    id: int
    log_treino_id: int
    e_recorde_peso: bool = False
    e_recorde_reps: bool = False
    exercicio: Exercicio 
    model_config = orm_config

# ---------------------------------
# Schemas de LogTreino (O Treino Ativo/Finalizado)
# ---------------------------------
class LogTreinoCreate(BaseModel):
    rotina_id: Optional[int] = None 

class LogTreino(BaseModel):
    id: int
    usuario_id: int
    data_inicio: datetime
    data_fim: Optional[datetime] = None
    pontos_esforco_total: Optional[int] = 0
    rotina: Optional[Rotina] = None 
    series: List[LogSerie] = [] 
    model_config = orm_config

# ---------------------------------
# Schemas de Usuário (Auth)
# ---------------------------------
class UserBase(BaseModel):
    email: str
    nome_usuario: str

class UserCreate(UserBase):
    senha: str 

class Usuario(UserBase):
    id: int
    data_criacao: datetime
    model_config = orm_config

# ---------------------------------
# Schemas de Amizade
# ---------------------------------
class SolicitacaoAmizade(BaseModel):
    id: int
    solicitante_id: int
    receptor_id: int
    status: str
    data_solicitacao: datetime
    solicitante: Usuario 
    model_config = orm_config

# ---------------------------------
# Schemas de Ranking
# ---------------------------------
class RankingSemanal(BaseModel):
    id: int
    usuario_id: int
    pontos_totais: int
    semana: int
    ano: int
    usuario: Usuario 
    model_config = orm_config

# ---------------------------------
# Schemas de Feed/Social (Comentários e Reações)
# ---------------------------------
class ComentarioCreate(BaseModel):
    texto: str

class Comentario(ComentarioCreate):
    id: int
    usuario_id: int
    log_treino_id: int
    data_criacao: datetime
    usuario: Usuario
    model_config = orm_config

class Reacao(BaseModel):
    id: int
    usuario_id: int
    log_treino_id: int
    tipo: str 
    usuario: Usuario
    model_config = orm_config

# ---------------------------------
# Schemas de Resposta de Token (Auth)
# ---------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    nome_usuario: Optional[str] = None

# (Adicione este código ao seu app/schemas.py)

# ---------------------------------
# Schemas de Ranking
# ---------------------------------
class RankingSemanal(BaseModel):
    id: int
    usuario_id: int
    pontos_totais: int
    semana: int
    ano: int
    usuario: Usuario 
    model_config = orm_config

# --- INÍCIO DA CORREÇÃO: ADICIONAR ESTE NOVO SCHEMA ---
# Este é o schema que o seu router /ranking/semanal
# constrói manualmente para incluir a posição.
class RankingEntry(BaseModel):
    posicao: int
    pontos_totais: int
    usuario: Usuario 
    # Este schema NÃO precisa de orm_config 
    # porque é construído manualmente, não lido do DB.
# --- FIM DA CORREÇÃO ---

class LogTreinoFinalizar(BaseModel):
    data_fim: datetime