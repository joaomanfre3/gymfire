# app/routers/ranking.py
# (Código completo e corrigido)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models

router = APIRouter(
    prefix="/ranking",
    tags=["Ranking e Pontuação"],
    dependencies=[Depends(security.get_usuario_atual)] # Todas as rotas aqui exigem login
)

@router.get("/semanal", response_model=List[schemas.RankingEntry])
def read_ranking_semanal(
    db: Session = Depends(database.get_db)
):
    """
    Busca o ranking semanal (Top 50) de todos os usuários.
    O ranking é baseado nos pontos acumulados na semana ISO atual.
    """
    
    # 1. Busca os dados ordenados do CRUD
    # db_ranking_list é uma lista de [models.RankingSemanal]
    db_ranking_list = crud.get_ranking_semanal(db, limit=50)
    
    # 2. Constrói a resposta adicionando a posição
    # Precisamos fazer isso manually porque o schema 'RankingEntry'
    # exige o campo 'posicao', que não existe no banco de dados
    # e é calculado baseado na ordem da lista.
    
    response_list: List[schemas.RankingEntry] = []
    
    for index, db_entry in enumerate(db_ranking_list):
        # db_entry é um models.RankingSemanal
        
        # --- CORREÇÃO: 'UserPublic' renomeado para 'Usuario' ---
        # (O Pydantic v2+ usa model_validate para carregar de um atributo ORM)
        user_data = schemas.Usuario.model_validate(db_entry.usuario)
        # --- FIM DA CORREÇÃO ---
        
        # Cria a entrada do ranking com a posição
        entry = schemas.RankingEntry(
            pontos_totais=db_entry.pontos_totais,
            usuario=user_data,
            posicao=index + 1 # Posição 1, 2, 3...
        )
        response_list.append(entry)
        
    return response_list