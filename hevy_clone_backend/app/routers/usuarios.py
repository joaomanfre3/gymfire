# app/routers/usuarios.py
# (Não quero canvas)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuários"],
    dependencies=[Depends(security.get_usuario_atual)] # Todas as rotas aqui exigem login
)

@router.get("/buscar/{nome_parcial}", response_model=List[schemas.UserPublic])
def buscar_usuarios_por_nome(
    nome_parcial: str,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Busca usuários pelo nome (busca parcial).
    Usado pela página 'Amigos' para encontrar novos amigos.
    Retorna uma lista de usuários que correspondem ao 'nome_parcial'.
    """
    if not nome_parcial or len(nome_parcial) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="A busca precisa ter pelo menos 2 caracteres."
        )
        
    # Esta função (buscar_usuarios_por_nome) precisa de existir no crud.py
    # Vamos criá-la no próximo passo.
    db_usuarios = crud.buscar_usuarios_por_nome(
        db, 
        nome_parcial=nome_parcial, 
        usuario_atual_id=usuario_atual.id
    )
    
    return db_usuarios