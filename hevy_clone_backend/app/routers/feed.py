# app/routers/feed.py
# (Não quero canvas)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models

router = APIRouter(
    prefix="/feed",
    tags=["Feed Social"],
    dependencies=[Depends(security.get_usuario_atual)] # Todas as rotas aqui exigem login
)

@router.get("/", response_model=List[schemas.LogTreinoFeed])
def read_feed_treinos(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual),
    skip: int = 0,
    limit: int = 20
):
    """
    Busca o feed social do usuário.
    Retorna os treinos finalizados do próprio usuário e de seus amigos,
    ordenados do mais recente para o mais antigo.
    """
    # A função CRUD já lida com a lógica de buscar treinos de amigos + próprios
    db_treinos = crud.get_feed_treinos(db, usuario_id=usuario_atual.id, skip=skip, limit=limit)
    
    # Precisamos converter a lista de 'models.LogTreino' para 'schemas.LogTreinoFeed'
    # O .model_validate() carrega os relacionamentos aninhados (usuario, reacoes, etc)
    feed_list: List[schemas.LogTreinoFeed] = []
    for treino in db_treinos:
        # Usa .model_validate() para construir o JSON complexo de saída
        feed_list.append(schemas.LogTreinoFeed.model_validate(treino))
    
    return feed_list

@router.post("/reacao/{log_treino_id}", response_model=schemas.ReacaoPublic, status_code=status.HTTP_201_CREATED)
def add_reacao_ao_treino(
    log_treino_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Adiciona uma reação ('props') a um item do feed.
    O usuário só pode reagir a treinos que ele pode ver (próprios ou de amigos).
    """
    # 1. Verifica se o usuário pode ver este treino (segurança)
    db_treino = crud.get_feed_item_por_id(db, log_treino_id, usuario_atual.id)
    if not db_treino:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treino não encontrado ou você não tem permissão para vê-lo.")
    
    # 2. Adiciona a reação (o CRUD lida com duplicatas)
    db_reacao = crud.add_reacao(db, usuario_id=usuario_atual.id, log_treino_id=log_treino_id)
    return db_reacao

@router.delete("/reacao/{log_treino_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_reacao_do_treino(
    log_treino_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Remove uma reação ('props') de um item do feed.
    """
    # 1. Verifica se a reação existe
    db_reacao = crud.get_reacao(db, usuario_id=usuario_atual.id, log_treino_id=log_treino_id)
    if not db_reacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reação não encontrada.")
        
    # 2. Remove a reação
    crud.remove_reacao(db, usuario_id=usuario_atual.id, log_treino_id=log_treino_id)
    return # Retorna 204 No Content

@router.post("/comentario/{log_treino_id}", response_model=schemas.ComentarioPublic, status_code=status.HTTP_201_CREATED)
def add_comentario_ao_treino(
    log_treino_id: int,
    comentario: schemas.ComentarioCreate,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Adiciona um comentário a um item do feed.
    O usuário só pode comentar em treinos que ele pode ver.
    """
    # 1. Verifica se o usuário pode ver este treino (segurança)
    db_treino = crud.get_feed_item_por_id(db, log_treino_id, usuario_atual.id)
    if not db_treino:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Treino não encontrado ou você não tem permissão para vê-lo.")
        
    # 2. Adiciona o comentário
    db_comentario = crud.add_comentario(db, usuario_id=usuario_atual.id, log_treino_id=log_treino_id, comentario=comentario)
    return db_comentario