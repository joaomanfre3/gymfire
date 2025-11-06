# app/routers/treinos.py
# (Código completo e corrigido)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models
from datetime import datetime # Importa o datetime

router = APIRouter(
    prefix="/treinos",
    tags=["Treinos (Logs)"],
    dependencies=[Depends(security.get_usuario_atual)] # Todas as rotas aqui exigem login
)

# --- CORREÇÃO 1: 'LogTreinoPublic' -> 'LogTreino' ---
@router.post("/iniciar", response_model=schemas.LogTreino, status_code=status.HTTP_201_CREATED)
def iniciar_treino(
    treino_data: schemas.LogTreinoCreate,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Inicia uma nova sessão de treino (cria um LogTreino).
    O app deve chamar esta rota quando o usuário aperta "Começar Treino".
    """
    db_log_treino = crud.create_log_treino(db, usuario_id=usuario_atual.id, treino=treino_data)
    return db_log_treino


# --- CORREÇÃO 2: 'LogSeriePublic' -> 'LogSerie' ---
@router.post("/adicionar_serie", response_model=schemas.LogSerie, status_code=status.HTTP_201_CREATED)
def adicionar_serie_ao_treino(
    serie_data: schemas.LogSerieCreate,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Adiciona uma nova série (ex: 10x 80kg) a um treino existente.
    Verifica se o treino pertence ao usuário logado.
    """
    # 1. Verifica if o LogTreino "pai" existe e pertence ao usuário
    db_log_treino = crud.get_log_treino_por_id(
        db, 
        log_treino_id=serie_data.log_treino_id, 
        usuario_id=usuario_atual.id
    )
    
    if not db_log_treino:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log de treino não encontrado ou não pertence a você.")
        
    # 2. Verifica if o treino já foi finalizado
    if db_log_treino.data_fim:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este treino já foi finalizado e não pode ser modificado.")
        
    # 3. Cria a série (o CRUD vai checar os recordes)
    db_log_serie = crud.create_log_serie(db, usuario_id=usuario_atual.id, serie=serie_data)
    return db_log_serie


# --- CORREÇÃO 3: 'LogTreinoPublic' -> 'LogTreino' ---
# (O schema 'LogTreinoFinalizar' (linha 62) vai causar o próximo erro)
@router.post("/{log_treino_id}/finalizar", response_model=schemas.LogTreino)
def finalizar_treino(
    log_treino_id: int,
    treino_data: schemas.LogTreinoFinalizar, # Contém a data_fim
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Finaliza uma sessão de treino.
    Isto irá calcular os pontos de esforço e adicioná-los ao ranking semanal.
    """
    # 1. Busca o treino e verifica a propriedade
    db_log_treino = crud.get_log_treino_por_id(
        db, 
        log_treino_id=log_treino_id, 
        usuario_id=usuario_atual.id
    )
    
    if not db_log_treino:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log de treino não encontrado ou não pertence a você.")
        
    if db_log_treino.data_fim:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este treino já foi finalizado.")
        
    # 2. Chama a função do CRUD para finalizar
    db_treino_finalizado = crud.finalizar_log_treino(
        db, 
        log_treino=db_log_treino, 
        data_fim=treino_data.data_fim
    )
    
    return db_treino_finalizado


# --- CORREÇÃO 4: 'LogTreinoPublic' -> 'LogTreino' ---
@router.get("/{log_treino_id}", response_model=schemas.LogTreino)
def read_log_treino(
    log_treino_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Busca um log de treino específico (e todas as suas séries) pelo ID.
    Garante que o usuário só possa ver os próprios treinos.
    """
    db_log_treino = crud.get_log_treino_por_id(
        db, 
        log_treino_id=log_treino_id, 
        usuario_id=usuario_atual.id
    )
    
    if not db_log_treino:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log de treino não encontrado.")
        
    return db_log_treino

# (Opcional) Rota para listar todos os treinos do usuário
# --- CORREÇÃO 5: 'LogTreinoPublic' -> 'LogTreino' ---
@router.get("/", response_model=List[schemas.LogTreino])
def read_logs_treino_usuario(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual),
    skip: int = 0,
    limit: int = 25
):
    """
    Lista o histórico de treinos finalizados do usuário logado (paginado).
    """
    logs = db.query(models.LogTreino).filter(
        models.LogTreino.usuario_id == usuario_atual.id
    ).order_by(
        models.LogTreino.data_inicio.desc()
    ).offset(skip).limit(limit).all()
    
    return logs

# --- CORREÇÃO 6: 'LogTreinoPublic' -> 'LogTreino' ---
@router.get("/por_rotina/{rotina_id}", response_model=List[schemas.LogTreino])
def read_logs_por_rotina(
    rotina_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Busca o histórico de treinos finalizados de uma rotina específica,
    verificando if o usuário é o dono da rotina.
    """
    
    # 1. Verifica if a rotina "pai" (o "Deck") pertence ao usuário
    db_rotina = crud.get_rotina_por_id(db, rotina_id=rotina_id)
    if not db_rotina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rotina não encontrada.")
    
    if db_rotina.usuario_id != usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para ver esta rotina.")

    # 2. Busca os logs (função que já existe no crud.py)
    db_logs = crud.get_logs_por_rotina(db, rotina_id=rotina_id)
    return db_logs
# --- FIM DA CORREÇÃO ---