# app/routers/exercicios.py
# (Não quero canvas)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, database, security

router = APIRouter(
    prefix="/exercicios",
    tags=["Exercícios"],
    # Todas as rotas aqui vão exigir um token válido
    dependencies=[Depends(security.get_usuario_atual)]
)

@router.get("/", response_model=List[schemas.Exercicio])
def read_exercicios(
    grupo_muscular: Optional[str] = Query(None, description="Filtrar por grupo muscular (ex: Peito, Pernas)"),
    db: Session = Depends(database.get_db)
):
    """
    Lista todos os exercícios da biblioteca ("Cartas").
    Pode ser filtrado por grupo_muscular (Query Parameter).
    """
    if grupo_muscular:
        # Validação simples do ENUM
        grupos_validos = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Outro']
        if grupo_muscular not in grupos_validos:
            raise HTTPException(status_code=400, detail="Grupo muscular inválido.")
        
        exercicios = crud.get_exercicios_por_grupo(db, grupo=grupo_muscular)
    else:
        # Chama a função do crud.py para buscar todos os exercícios
        exercicios = crud.get_exercicios(db, skip=0, limit=200) # Limite de 200 para carregar no modal
        
    return exercicios