# app/routers/pastas.py
# (Este é um NOVO FICHEIRO - Código Completo)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models

router = APIRouter(
    prefix="/pastas",
    tags=["Pastas (Organização)"],
    dependencies=[Depends(security.get_usuario_atual)]
)

@router.post("/", response_model=schemas.Pasta, status_code=status.HTTP_201_CREATED)
def create_pasta_para_usuario(
    pasta: schemas.PastaCreate,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Cria uma nova pasta de organização (ex: 'PPL', 'Bulking') 
    para o usuário logado.
    """
    return crud.create_pasta(db=db, pasta=pasta, usuario_id=usuario_atual.id)

@router.get("/", response_model=List[schemas.Pasta])
def read_pastas_do_usuario(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Lista todas as pastas do usuário.
    
    Graças ao SQLAlchemy, o campo 'rotinas' de cada pasta
    será preenchido automaticamente com os "Decks" que pertencem a ela.
    """
    return crud.get_pastas_por_usuario(db, usuario_id=usuario_atual.id)

@router.get("/{pasta_id}", response_model=schemas.Pasta)
def read_pasta_especifica(
    pasta_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Busca os detalhes de uma pasta específica pelo ID, 
    verificando if ela pertence ao usuário logado.
    """
    db_pasta = crud.get_pasta_por_id(db, pasta_id=pasta_id, usuario_id=usuario_atual.id)
    
    if db_pasta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada ou não pertence a você")
        
    return db_pasta

@router.put("/{pasta_id}", response_model=schemas.Pasta)
def update_pasta_especifica(
    pasta_id: int,
    pasta_data: schemas.PastaUpdate, # Espera um JSON com {"nome": "Novo Nome"}
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Atualiza o nome de uma pasta específica,
    verificando if ela pertence ao usuário logado.
    """
    # 1. Busca a pasta e verifica a posse
    db_pasta = crud.get_pasta_por_id(db, pasta_id=pasta_id, usuario_id=usuario_atual.id)
    if db_pasta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada ou não pertence a você")
    
    # 2. Atualiza os dados
    return crud.update_pasta(db=db, pasta=db_pasta, pasta_data=pasta_data)

@router.delete("/{pasta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pasta_especifica(
    pasta_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Deleta uma pasta específica, verificando a posse.
    
    As rotinas (Decks) que estavam dentro desta pasta NÃO serão
    deletadas; elas apenas terão seu 'pasta_id' definido como NULL
    e aparecerão na "raiz" (no endpoint GET /rotinas/).
    """
    # 1. Busca a pasta e verifica a posse
    db_pasta = crud.get_pasta_por_id(db, pasta_id=pasta_id, usuario_id=usuario_atual.id)
    if db_pasta is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pasta não encontrada ou não pertence a você")

    # 2. Deleta a pasta
    crud.delete_pasta(db=db, pasta=db_pasta)
    
    # Retorna 204 No Content (sucesso sem corpo de resposta)
    return