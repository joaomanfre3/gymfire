# app/routers/rotinas.py
# (Código completo e corrigido)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models

router = APIRouter(
    prefix="/rotinas",
    tags=["Rotinas (Decks)"],
    dependencies=[Depends(security.get_usuario_atual)]
)

@router.post("/", response_model=schemas.Rotina, status_code=status.HTTP_201_CREATED)
def create_rotina(
    rotina: schemas.RotinaCreate, 
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Cria uma nova rotina (deck) vazia para o usuário logado.
    
    # --- CORREÇÃO ---
    Opcionalmente, pode receber um "pasta_id" no JSON para
    associar esta rotina diretamente a uma pasta.
    """
    # Chama o crud.create_rotina (que já corrigimos para aceitar 'pasta_id')
    return crud.create_rotina(db=db, rotina=rotina, usuario_id=usuario_atual.id)

@router.get("/", response_model=List[schemas.Rotina])
def read_rotinas_do_usuario(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    # --- CORREÇÃO ---
    Lista APENAS as rotinas (decks) "órfãs" (que não estão em nenhuma pasta).
    
    As rotinas organizadas em pastas devem ser obtidas
    através do endpoint GET /pastas/
    """
    # Esta chamada agora usa o crud.get_rotinas_por_usuario corrigido (com filtro pasta_id == None)
    rotinas = crud.get_rotinas_por_usuario(db, usuario_id=usuario_atual.id)
    return rotinas

@router.get("/{rotina_id}", response_model=schemas.Rotina)
def read_rotina_especifica(
    rotina_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Busca uma rotina específica pelo ID (o "Deck" detalhado).
    Garante que o usuário só possa ver a própria rotina.
    """
    db_rotina = crud.get_rotina_por_id(db, rotina_id=rotina_id)
    
    if db_rotina is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rotina não encontrada")
    
    # Verifica se o 'usuario_id' da rotina é o mesmo do token
    if db_rotina.usuario_id != usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para ver esta rotina")
        
    return db_rotina


# --- ESTA É A NOVA ROTA QUE EU PROMETI ---
# (Usando a sua analogia do Clash Royale)

@router.post("/{rotina_id}/exercicios", response_model=schemas.RotinaExercicioPublic, status_code=status.HTTP_201_CREATED)
def add_exercicio_para_rotina(
    rotina_id: int, # O ID do "Deck" (da URL)
    exercicio_data: schemas.ExercicioRotinaCreate, # O JSON com a "Carta" (do Body)
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """
    Adiciona uma "Carta" (Exercício) a um "Deck" (Rotina).
    Verifica se o usuário é o dono do Deck antes de adicionar.
    """
    
    # 1. Primeiro, busca o "Deck" (Rotina) para garantir que ele existe
    db_rotina = crud.get_rotina_por_id(db, rotina_id=rotina_id)
    
    if db_rotina is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rotina (Deck) não encontrada")
        
    # 2. Verifica se o usuário logado (do token) é o dono deste "Deck"
    if db_rotina.usuario_id != usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para adicionar exercícios a este Deck")
    
    # 3. (Opcional) TODO: Verificar se o 'exercicio_id' existe na tabela 'exercicios'.
    #     (O seu 'crud.py' ainda não tem um 'get_exercicio_por_id',
    #     mas o constraint do DB deve apanhar isto (como um erro 500 ou IntegrityError).
    #     Por agora, vamos assumir que o frontend envia um ID válido.)
    
    # 4. Chama a função do CRUD (que já atualizámos) para criar o 'RotinaExercicio'
    return crud.add_exercicio_a_rotina(db=db, rotina_id=rotina_id, exercicio=exercicio_data)

# --- FIM DA NOVA ROTA ---