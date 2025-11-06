# app/routers/amizades.py
# (Código completo e corrigido)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, database, security, models # <-- CORREÇÃO: Importado 'models'

router = APIRouter(
    prefix="/amigos",
    tags=["Amizades e Social"],
    dependencies=[Depends(security.get_usuario_atual)] # Todas as rotas aqui exigem login
)

@router.post("/solicitar/{receptor_id}", status_code=status.HTTP_201_CREATED)
def enviar_solicitacao(
    receptor_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """Envia uma solicitação de amizade para outro usuário."""
    
    if receptor_id == usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você não pode adicionar a si mesmo.")
    
    # Verifica se o usuário para quem se está enviando existe
    receptor = db.query(models.Usuario).filter(models.Usuario.id == receptor_id).first()
    if not receptor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    
    # Verifica se já existe uma amizade ou solicitação
    solicitacao_existente = crud.get_solicitacao_existente(db, usuario_atual.id, receptor_id)
    if solicitacao_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Já existe uma solicitação ou amizade com este usuário (Status: {solicitacao_existente.status})")
    
    crud.enviar_solicitacao_amizade(db, solicitante_id=usuario_atual.id, receptor_id=receptor_id)
    return {"status": "Solicitação enviada com sucesso."}


# --- CORREÇÃO 1: O ERRO DO TRACEBACK ---
# 'SolicitacaoPendente' foi renomeado para o schema correto 'SolicitacaoAmizade'
@router.get("/solicitacoes/pendentes", response_model=List[schemas.SolicitacaoAmizade])
def listar_solicitacoes_pendentes(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """Lista todas as solicitações de amizade que ESTE usuário recebeu."""
    return crud.get_solicitacoes_pendentes(db, usuario_id=usuario_atual.id)
# --- FIM DA CORREÇÃO 1 ---


@router.post("/aceitar/{solicitacao_id}", status_code=status.HTTP_200_OK)
def aceitar_solicitacao(
    solicitacao_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """Aceita uma solicitação de amizade pendente."""
    solicitacao = crud.get_solicitacao_por_id(db, solicitacao_id)
    
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")
    
    # IMPORTANTE: Verifica se o usuário logado é o RECEPTOR da solicitação
    if solicitacao.receptor_id != usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para aceitar esta solicitação.")
        
    if solicitacao.status != 'pendente':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Esta solicitação não está mais pendente (Status: {solicitacao.status}).")

    crud.responder_solicitacao_amizade(db, solicitacao, novo_status='aceito')
    return {"status": "Amizade aceita."}


@router.post("/recusar/{solicitacao_id}", status_code=status.HTTP_200_OK)
def recusar_solicitacao(
    solicitacao_id: int,
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """Recusa uma solicitação de amizade pendente."""
    solicitacao = crud.get_solicitacao_por_id(db, solicitacao_id)
    
    if not solicitacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitação não encontrada.")
    
    # IMPORTANTE: Verifica se o usuário logado é o RECEPTOR da solicitação
    if solicitacao.receptor_id != usuario_atual.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para recusar esta solicitação.")
        
    if solicitacao.status != 'pendente':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta solicitação não está mais pendente.")

    crud.responder_solicitacao_amizade(db, solicitacao, novo_status='recusado')
    return {"status": "Solicitação recusada."}


# --- CORREÇÃO 2: ERRO PREVENTIVO ---
# 'UserPublic' foi renomeado para o schema correto 'Usuario'
@router.get("/", response_model=List[schemas.Usuario])
def listar_amigos(
    db: Session = Depends(database.get_db),
    usuario_atual: models.Usuario = Depends(security.get_usuario_atual)
):
    """Lista todos os usuários que são amigos (status 'aceito') do usuário logado."""
    return crud.get_amigos(db, usuario_id=usuario_atual.id)
# --- FIM DA CORREÇÃO 2 ---