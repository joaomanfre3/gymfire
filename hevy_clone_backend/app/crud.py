# app/crud.py
# (Código completo e corrigido)

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc
from . import models, schemas, security
from datetime import datetime

# "CRUD" = Create, Read, Update, Delete
# Funções que isolam a lógica de banco de dados.

# --- CRUD de Usuário ---


def get_usuario_por_email(db: Session, email: str) -> models.Usuario | None:
    """Busca um usuário pelo email"""
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def get_usuario_por_nome(db: Session, nome_usuario: str) -> models.Usuario | None:
    """Busca um usuário pelo nome_usuario"""
    return db.query(models.Usuario).filter(models.Usuario.nome_usuario == nome_usuario).first()

def create_usuario(db: Session, usuario: schemas.UserCreate) -> models.Usuario:
    """Cria um novo usuário no banco"""
    # Criptografa a senha antes de salvar
    hash_senha = security.get_hash_senha(usuario.senha)
    db_usuario = models.Usuario(
        email=usuario.email,
        nome_usuario=usuario.nome_usuario,
        senha_hash=hash_senha
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

# --- CORREÇÃO: NOVA FUNÇÃO DE BUSCA ADICIONADA ---
def buscar_usuarios_por_nome(db: Session, nome_parcial: str, usuario_atual_id: int, limit: int = 10) -> list[models.Usuario]:
    """
    Busca usuários cujo 'nome_usuario' começa com o 'nome_parcial'.
    Usado pela barra de busca de amigos.
    Exclui o próprio usuário da busca.
    """
    # O 'ilike' faz uma busca "case-insensitive" (ignora maiúsculas/minúsculas)
    # O f"{nome_parcial}%" procura por nomes que *começam* com o termo
    return db.query(models.Usuario).filter(
        models.Usuario.nome_usuario.ilike(f"{nome_parcial}%"),
        models.Usuario.id != usuario_atual_id # Exclui o próprio usuário
    ).limit(limit).all()
# --- FIM DA CORREÇÃO ---


# --- CRUD de Exercício ---

def get_exercicios(db: Session, skip: int = 0, limit: int = 100) -> list[models.Exercicio]:
    """Busca todos os exercícios com paginação"""
    return db.query(models.Exercicio).offset(skip).limit(limit).all()

def get_exercicios_por_grupo(db: Session, grupo: str) -> list[models.Exercicio]:
    """Busca exercícios filtrando por grupo muscular"""
    return db.query(models.Exercicio).filter(models.Exercicio.grupo_muscular == grupo).all()

def inicializar_exercicios(db: Session) -> bool:
    """
    Adiciona exercícios padrão ao banco de dados se a tabela estiver vazia.
    Isto é necessário para que o SeletorExercicio funcione no frontend.
    Retorna True se foram adicionados novos exercícios.
    """
    # 1. Verifica se a tabela já tem exercícios
    if db.query(models.Exercicio).count() > 0:
        return False # Já está populada, não faz nada
    
    # 2. Lista de "Cartas" (Exercícios) padrão
    exercicios_padrao = [
        # Peito
        {'nome': 'Supino Reto (Barra)', 'grupo_muscular': 'Peito'},
        {'nome': 'Supino Inclinado (Halteres)', 'grupo_muscular': 'Peito'},
        {'nome': 'Crucifixo (Cabos)', 'grupo_muscular': 'Peito'},
        {'nome': 'Flexões (Push-up)', 'grupo_muscular': 'Peito'},
        # Costas
        {'nome': 'Barra Fixa (Pull-up)', 'grupo_muscular': 'Costas'},
        {'nome': 'Remada Curvada (Barra)', 'grupo_muscular': 'Costas'},
        {'nome': 'Puxada Alta (Lat Pulldown)', 'grupo_muscular': 'Costas'},
        {'nome': 'Remada Cavalinho', 'grupo_muscular': 'Costas'},
        # Pernas
        {'nome': 'Agachamento Livre', 'grupo_muscular': 'Pernas'},
        {'nome': 'Leg Press 45°', 'grupo_muscular': 'Pernas'},
        {'nome': 'Cadeira Extensora', 'grupo_muscular': 'Pernas'},
        {'nome': 'Mesa Flexora', 'grupo_muscular': 'Pernas'},
        {'nome': 'Levantamento Terra (Deadlift)', 'grupo_muscular': 'Pernas'},
        # Ombros
        {'nome': 'Desenvolvimento Militar (Barra)', 'grupo_muscular': 'Ombros'},
        {'nome': 'Desenvolvimento (Halteres)', 'grupo_muscular': 'Ombros'},
        {'nome': 'Elevação Lateral', 'grupo_muscular': 'Ombros'},
        # Bíceps
        {'nome': 'Rosca Direta (Barra)', 'grupo_muscular': 'Bíceps'},
        {'nome': 'Rosca Alternada (Halteres)', 'grupo_muscular': 'Bíceps'},
        # Tríceps
        {'nome': 'Tríceps Corda (Pushdown)', 'grupo_muscular': 'Tríceps'},
        {'nome': 'Mergulho (Paralelas)', 'grupo_muscular': 'Tríceps'},
        # Outros
        {'nome': 'Prancha Abdominal', 'grupo_muscular': 'Abdômen'},
        {'nome': 'Esteira', 'grupo_muscular': 'Cardio'},
    ]
    
    # 3. Adiciona todos ao DB
    for ex_data in exercicios_padrao:
        db_exercicio = models.Exercicio(**ex_data)
        db.add(db_exercicio)
        
    db.commit()
    print(">>> INFORMAÇÃO: Tabela 'exercicios' populada com dados iniciais.")
    return True
# --- FIM DA FUNÇÃO ---


# --- INÍCIO DA CORREÇÃO (NOVA SECÇÃO DE PASTAS) ---
# --- CRUD de Pasta ---

def create_pasta(db: Session, pasta: schemas.PastaCreate, usuario_id: int) -> models.Pasta:
    """Cria uma nova pasta de rotinas para o usuário."""
    db_pasta = models.Pasta(
        nome=pasta.nome,
        usuario_id=usuario_id
    )
    db.add(db_pasta)
    db.commit()
    db.refresh(db_pasta)
    return db_pasta

def get_pastas_por_usuario(db: Session, usuario_id: int) -> list[models.Pasta]:
    """
    Busca todas as pastas de um usuário.
    (A relação 'rotinas' em cada pasta será populada automaticamente pelo SQLAlchemy
    devido ao relationship() definido em models.py)
    """
    return db.query(models.Pasta).filter(
        models.Pasta.usuario_id == usuario_id
    ).all()

def get_pasta_por_id(db: Session, pasta_id: int, usuario_id: int) -> models.Pasta | None:
    """Busca uma pasta específica, garantindo que pertence ao usuário."""
    return db.query(models.Pasta).filter(
        models.Pasta.id == pasta_id,
        models.Pasta.usuario_id == usuario_id
    ).first()

def update_pasta(db: Session, pasta: models.Pasta, pasta_data: schemas.PastaUpdate) -> models.Pasta:
    """Atualiza o nome de uma pasta."""
    pasta.nome = pasta_data.nome
    db.commit()
    db.refresh(pasta)
    return pasta

def delete_pasta(db: Session, pasta: models.Pasta):
    """
    Deleta uma pasta.
    Obrigado ao 'ON DELETE SET NULL' na migration SQL,
    todas as rotinas que estavam nesta pasta terão seu 'pasta_id'
    automaticamente definido como NULL (ficarão órfãs).
    """
    db.delete(pasta)
    db.commit()
    return
# --- FIM DA CORREÇÃO ---


# --- CRUD de Rotina ---

def create_rotina(db: Session, rotina: schemas.RotinaCreate, usuario_id: int) -> models.Rotina:
    """
    Cria um nova rotina (deck) VAZIA para o usuário.
    # --- CORREÇÃO ---
    Agora, aceita um 'pasta_id' opcional.
    """
    
    # 1. Cria a Rotina "pai" (o "Deck")
    db_rotina = models.Rotina(
        nome=rotina.nome,
        descricao=rotina.descricao,
        usuario_id=usuario_id,
        pasta_id=rotina.pasta_id  # <-- CORREÇÃO: Linha adicionada
    )
    db.add(db_rotina)
    
    # O loop 'for ex in rotina.exercicios:' já foi removido (Correção anterior do 422)
    
    db.commit()
    db.refresh(db_rotina)
    return db_rotina

def get_rotinas_por_usuario(db: Session, usuario_id: int) -> list[models.Rotina]:
    """
    Busca todas as rotinas de um usuário que NÃO estão em uma pasta.
    (Rotinas "Órfãs" ou "na Raiz")
    
    # --- CORREÇÃO ---
    Esta função agora filtra rotinas onde 'pasta_id' é NULO
    para resolver o problema das "rotinas voando".
    As rotinas *dentro* de pastas serão obtidas através de get_pastas_por_usuario.
    """
    return db.query(models.Rotina).filter(
        models.Rotina.usuario_id == usuario_id,
        models.Rotina.pasta_id == None  # <-- CORREÇÃO: Condição adicionada
    ).all()

def get_rotina_por_id(db: Session, rotina_id: int) -> models.Rotina | None:
    """Busca uma rotina específica pelo ID"""
    return db.query(models.Rotina).filter(models.Rotina.id == rotina_id).first()

def add_exercicio_a_rotina(db: Session, rotina_id: int, exercicio: schemas.ExercicioRotinaCreate) -> models.RotinaExercicio:
    """
    Adiciona uma "Carta" (Exercício) a um "Deck" (Rotina).
    Isto cria a entrada na tabela 'rotina_exercicios'.
    """
    db_rotina_exercicio = models.RotinaExercicio(
        rotina_id=rotina_id,
        exercicio_id=exercicio.exercicio_id,
        ordem=exercicio.ordem
    )
    db.add(db_rotina_exercicio)
    db.commit()
    db.refresh(db_rotina_exercicio)
    return db_rotina_exercicio
# --- FIM DA NOVA FUNÇÃO ---


# --- CRUD de Amizade ---

def get_solicitacao_existente(db: Session, id_usuario_1: int, id_usuario_2: int) -> models.Amizade | None:
    """Verifica se já existe um registro de amizade entre dois usuários, em qualquer direção."""
    return db.query(models.Amizade).filter(
        or_(
            and_(models.Amizade.solicitante_id == id_usuario_1, models.Amizade.receptor_id == id_usuario_2),
            and_(models.Amizade.solicitante_id == id_usuario_2, models.Amizade.receptor_id == id_usuario_1)
        )
    ).first()

def enviar_solicitacao_amizade(db: Session, solicitante_id: int, receptor_id: int) -> models.Amizade:
    """Cria um novo registro de amizade com status 'pendente'."""
    db_amizade = models.Amizade(
        solicitante_id=solicitante_id,
        receptor_id=receptor_id,
        status='pendente'
    )
    db.add(db_amizade)
    db.commit()
    db.refresh(db_amizade)
    return db_amizade

def get_solicitacao_por_id(db: Session, solicitacao_id: int) -> models.Amizade | None:
    """Busca uma solicitação de amizade específica pelo seu ID."""
    return db.query(models.Amizade).filter(models.Amizade.id == solicitacao_id).first()

def responder_solicitacao_amizade(db: Session, solicitacao: models.Amizade, novo_status: str) -> models.Amizade:
    """Atualiza o status de uma solicitação (para 'aceito' ou 'recusado')."""
    solicitacao.status = novo_status
    db.commit()
    db.refresh(solicitacao)
    return solicitacao

def get_solicitacoes_pendentes(db: Session, usuario_id: int) -> list[models.Amizade]:
    """Retorna todas as solicitações 'pendentes' que o usuário RECEBEU."""
    return db.query(models.Amizade).filter(
        models.Amizade.receptor_id == usuario_id,
        models.Amizade.status == 'pendente'
    ).all()

def get_amigos(db: Session, usuario_id: int) -> list[models.Usuario]:
    """Retorna uma lista de objetos Usuario que são amigos (status 'aceito')."""
    
    amigos_onde_sou_solicitante = db.query(models.Usuario).join(
        models.Amizade, models.Usuario.id == models.Amizade.receptor_id
    ).filter(
        models.Amizade.solicitante_id == usuario_id,
        models.Amizade.status == 'aceito'
    )
    amigos_onde_sou_receptor = db.query(models.Usuario).join(
        models.Amizade, models.Usuario.id == models.Amizade.solicitante_id
    ).filter(
        models.Amizade.receptor_id == usuario_id,
        models.Amizade.status == 'aceito'
    )
    
    return amigos_onde_sou_solicitante.union(amigos_onde_receptor).all()


# --- CRUD de Ranking ---

def get_ano_semana_atual() -> tuple[int, int]:
    """Retorna o ano e o número da semana (ISO) atuais."""
    calendario = datetime.now().isocalendar()
    return calendario[0], calendario[1] # ano, semana

def get_or_create_ranking_entry(db: Session, usuario_id: int) -> models.RankingSemanal:
    """
    Busca o registro de ranking da semana atual para o usuário.
    Se não existir, cria um novo com 0 pontos.
    """
    ano, semana = get_ano_semana_atual()
    
    db_entry = db.query(models.RankingSemanal).filter(
        models.RankingSemanal.usuario_id == usuario_id,
        models.RankingSemanal.semana == semana,
        models.RankingSemanal.ano == ano
    ).first()
    
    if db_entry:
        return db_entry
    
    novo_entry = models.RankingSemanal(
        usuario_id=usuario_id,
        pontos_totais=0,
        semana=semana,
        ano=ano
    )
    db.add(novo_entry)
    db.commit()
    db.refresh(novo_entry)
    return novo_entry

def adicionar_pontos_ranking(db: Session, usuario_id: int, pontos: int) -> models.RankingSemanal:
    """
    Adiciona pontos ao registro de ranking semanal de um usuário.
    (Esta função será chamada quando um LogTreino for finalizado)
    """
    db_entry = get_or_create_ranking_entry(db, usuario_id)
    db_entry.pontos_totais += pontos
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_ranking_semanal(db: Session, limit: int = 50) -> list[models.RankingSemanal]:
    """
    Retorna os X melhores usuários (e seus pontos) da semana atual,
    ordenados da maior pontuação para a menor.
    """
    ano, semana = get_ano_semana_atual()
    
    return db.query(models.RankingSemanal).filter(
        models.RankingSemanal.semana == semana,
        models.RankingSemanal.ano == ano
    ).order_by(
        models.RankingSemanal.pontos_totais.desc()
    ).limit(limit).all()


# --- CRUD de LogTreino (Registro) ---

def get_log_treino_por_id(db: Session, log_treino_id: int, usuario_id: int) -> models.LogTreino | None:
    """Busca um treino específico, garantindo que pertence ao usuário."""
    return db.query(models.LogTreino).filter(
        models.LogTreino.id == log_treino_id,
        models.LogTreino.usuario_id == usuario_id
    ).first()

def create_log_treino(db: Session, usuario_id: int, treino: schemas.LogTreinoCreate) -> models.LogTreino:
    """Inicia uma nova sessão de treino (LogTreino)."""
    db_log_treino = models.LogTreino(
        usuario_id=usuario_id,
        rotina_id=treino.rotina_id,
        data_inicio=datetime.now() # Define a data de início
    )
    db.add(db_log_treino)
    db.commit()
    db.refresh(db_log_treino)
    return db_log_treino

def _check_recordes(db: Session, usuario_id: int, exercicio_id: int, peso: float, repeticoes: int) -> tuple[bool, bool]:
    """
    Função helper para verificar se a série atual é um recorde de peso ou repetições.
    """
    max_peso_anterior = db.query(func.max(models.LogSerie.peso)).join(models.LogTreino).filter(
        models.LogTreino.usuario_id == usuario_id,
        models.LogSerie.exercicio_id == exercicio_id
    ).scalar()
    
    e_recorde_peso = peso > float(max_peso_anterior or 0)

    max_reps_com_este_peso = db.query(func.max(models.LogSerie.repeticoes)).join(models.LogTreino).filter(
        models.LogTreino.usuario_id == usuario_id,
        models.LogSerie.exercicio_id == exercicio_id,
        models.LogSerie.peso == peso
    ).scalar()

    e_recorde_reps = repeticoes > (max_reps_com_este_peso or 0)
    
    return e_recorde_peso, e_recorde_reps

def create_log_serie(db: Session, usuario_id: int, serie: schemas.LogSerieCreate) -> models.LogSerie:
    """Adiciona uma nova série a um LogTreino e verifica recordes."""
    
    e_recorde_peso, e_recorde_reps = _check_recordes(
        db, usuario_id, serie.exercicio_id, float(serie.peso), serie.repeticoes
    )
    
    db_log_serie = models.LogSerie(
        log_treino_id=serie.log_treino_id,
        exercicio_id=serie.exercicio_id,
        peso=serie.peso,
        repeticoes=serie.repeticoes,
        e_recorde_peso=e_recorde_peso,
        e_recorde_reps=e_recorde_reps
    )
    db.add(db_log_serie)
    db.commit()
    db.refresh(db_log_serie)
    return db_log_serie

def _calcular_pontos_treino(log_treino: models.LogTreino) -> int:
    """
    Função helper para calcular os pontos de esforço totais do treino.
    Fórmula: (Volume Total / 10) + (Bônus de 50 pontos por recorde)
    """
    if not log_treino.series:
        return 0
        
    volume_total = 0.0
    for serie in log_treino.series:
        volume_total += float(serie.peso) * serie.repeticoes
    
    pontos_volume = int(volume_total / 10)
    
    pontos_recorde = 0
    for serie in log_treino.series:
        if serie.e_recorde_peso or serie.e_recorde_reps:
            pontos_recorde += 50
            
    return pontos_volume + pontos_recorde

def finalizar_log_treino(db: Session, log_treino: models.LogTreino, data_fim: datetime) -> models.LogTreino:
    """
    Finaliza um treino, calcula os pontos e os adiciona ao ranking semanal.
    """
    log_treino.data_fim = data_fim
    pontos_ganhos = _calcular_pontos_treino(log_treino)
    log_treino.pontos_esforco_total = pontos_ganhos
    
    db.commit()
    
    if pontos_ganhos > 0:
        adicionar_pontos_ranking(db, usuario_id=log_treino.usuario_id, pontos=pontos_ganhos)
    
    db.refresh(log_treino)
    return log_treino


def get_logs_por_rotina(db: Session, rotina_id: int, limit: int = 50) -> list[models.LogTreino]:
    """
    Busca o histórico de treinos (LogTreinos) finalizados que usaram uma Rotina específica.
    """
    return db.query(models.LogTreino).filter(
        models.LogTreino.rotina_id == rotina_id,
        models.LogTreino.data_fim != None # Apenas treinos finalizados
    ).order_by(
        models.LogTreino.data_fim.desc()
    ).limit(limit).all()
# --- FIM DA CORREÇÃO ---


# --- CRUD de Feed Social ---

def get_feed_treinos(db: Session, usuario_id: int, skip: int = 0, limit: int = 20) -> list[models.LogTreino]:
    """
    Busca os treinos do feed: os treinos do próprio usuário + os treinos dos amigos.
    Ordenados do mais recente para o mais antigo.
    """
    amigos = get_amigos(db, usuario_id)
    amigos_ids = [amigo.id for amigo in amigos]
    feed_user_ids = amigos_ids + [usuario_id]
    
    return db.query(models.LogTreino).filter(
        models.LogTreino.usuario_id.in_(feed_user_ids),
        models.LogTreino.data_fim != None
    ).order_by(
        models.LogTreino.data_fim.desc()
    ).offset(skip).limit(limit).all()

def get_feed_item_por_id(db: Session, log_treino_id: int, usuario_atual_id: int) -> models.LogTreino | None:
    """
    Busca um único item de treino (LogTreino) pelo ID, verificando se o
    usuário atual tem permissão para vê-lo (se é dele ou de um amigo).
    """
    db_treino = db.query(models.LogTreino).filter(
        models.LogTreino.id == log_treino_id,
        models.LogTreino.data_fim != None
    ).first()
    
    if not db_treino:
        return None
        
    if db_treino.usuario_id == usuario_atual_id:
        return db_treino
        
    amizade = get_solicitacao_existente(db, usuario_atual_id, db_treino.usuario_id)
    
    if amizade and amizade.status == 'aceito':
        return db_treino
    
    return None

def get_reacao(db: Session, usuario_id: int, log_treino_id: int) -> models.Reacao | None:
    """BusCA uma reação específica de um usuário em um treino."""
    return db.query(models.Reacao).filter(
        models.Reacao.usuario_id == usuario_id,
        models.Reacao.log_treino_id == log_treino_id
    ).first()

def add_reacao(db: Session, usuario_id: int, log_treino_id: int, tipo: str = "props") -> models.Reacao:
    """Adiciona uma reação a um treino. Se já existir, apenas retorna a existente."""
    db_reacao = get_reacao(db, usuario_id, log_treino_id)
    
    if db_reacao:
        return db_reacao
        
    db_reacao = models.Reacao(
        usuario_id=usuario_id,
        log_treino_id=log_treino_id,
        tipo=tipo
    )
    db.add(db_reacao)
    db.commit()
    db.refresh(db_reacao)
    return db_reacao
    
def remove_reacao(db: Session, usuario_id: int, log_treino_id: int):
    """Remove uma reação de um treino."""
    db_reacao = get_reacao(db, usuario_id, log_treino_id)
    
    if db_reacao:
        db.delete(db_reacao)
        db.commit()
    return

def add_comentario(db: Session, usuario_id: int, log_treino_id: int, comentario: schemas.ComentarioCreate) -> models.Comentario:
    """Adiciona um novo comentário a um LogTreino."""
    db_comentario = models.Comentario(
        usuario_id=usuario_id,
        log_treino_id=log_treino_id,
        texto=comentario.texto
    )
    db.add(db_comentario)
    db.commit()
    db.refresh(db_comentario)
    return db_comentario