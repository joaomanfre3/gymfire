# app/models.py
# (Não quero canvas)

from sqlalchemy import Column, Integer, String, TIMESTAMP, Enum, ForeignKey, DECIMAL, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# Modelos que "espelham" as tabelas que criamos no MySQL

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nome_usuario = Column(String(50), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    data_criacao = Column(TIMESTAMP, server_default=func.now())
    cor_perfil = Column(String(7), default='#1E88E5')
    emoji_avatar = Column(String(5), default='💪')
    
    # Relacionamentos
    rotinas = relationship("Rotina", back_populates="usuario", cascade="all, delete-orphan")
    logs_treino = relationship("LogTreino", back_populates="usuario", cascade="all, delete-orphan")
    
    # --- CORREÇÃO (Implementação da sua ideia) ---
    pastas = relationship("Pasta", back_populates="usuario", cascade="all, delete-orphan")
    # --- FIM DA CORREÇÃO ---

    # Relacionamentos para o sistema de amizades
    amizades_enviadas = relationship("Amizade", foreign_keys="[Amizade.solicitante_id]", back_populates="solicitante", cascade="all, delete-orphan")
    amizades_recebidas = relationship("Amizade", foreign_keys="[Amizade.receptor_id]", back_populates="receptor", cascade="all, delete-orphan")

    # Relacionamento para o ranking
    rankings_semanais = relationship("RankingSemanal", back_populates="usuario", cascade="all, delete-orphan")

    # Relacionamentos para reações e comentários
    reacoes = relationship("Reacao", back_populates="usuario", cascade="all, delete-orphan")
    comentarios = relationship("Comentario", back_populates="usuario", cascade="all, delete-orphan")


class Exercicio(Base):
    __tablename__ = "exercicios"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False)
    grupo_muscular = Column(Enum('Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Cardio', 'Outro'), nullable=False)

# --- CORREÇÃO (Implementação da sua ideia) ---
# Nova tabela "Pasta" (a "gaveta" dos Decks)
class Pasta(Base):
    __tablename__ = "pastas"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(100), nullable=False)
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="pastas")
    # Uma pasta pode ter várias rotinas (Decks)
    rotinas = relationship("Rotina", back_populates="pasta") 
# --- FIM DA CORREÇÃO ---


class Rotina(Base):
    __tablename__ = "rotinas"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    
    # --- CORREÇÃO: Rotina (Deck) agora pertence a uma Pasta (opcional) ---
    # ondelete="SET NULL": Se a Pasta for apagada, a Rotina fica "voando" (sem pasta),
    # mas não é apagada.
    pasta_id = Column(Integer, ForeignKey("pastas.id", ondelete="SET NULL"), nullable=True)
    # --- FIM DA CORREÇÃO ---
    
    nome = Column(String(100), nullable=False)
    descricao = Column(String(255))
    data_criacao = Column(TIMESTAMP, server_default=func.now())
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="rotinas")
    # --- CORREÇÃO: Relacionamento de volta para a Pasta ---
    pasta = relationship("Pasta", back_populates="rotinas")
    # --- FIM DA CORREÇÃO ---
    exercicios_rotina = relationship("RotinaExercicio", back_populates="rotina", cascade="all, delete-orphan")

class RotinaExercicio(Base):
    __tablename__ = "rotina_exercicios"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rotina_id = Column(Integer, ForeignKey("rotinas.id", ondelete="CASCADE"), nullable=False)
    exercicio_id = Column(Integer, ForeignKey("exercicios.id", ondelete="CASCADE"), nullable=False)
    ordem = Column(Integer, nullable=False)
    
    # Relacionamentos
    rotina = relationship("Rotina", back_populates="exercicios_rotina")
    exercicio = relationship("Exercicio")

class LogTreino(Base):
    __tablename__ = "logs_treino"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    rotina_id = Column(Integer, ForeignKey("rotinas.id", ondelete="SET NULL"), nullable=True)
    data_inicio = Column(TIMESTAMP, server_default=func.now())
    data_fim = Column(TIMESTAMP, nullable=True)
    pontos_esforco_total = Column(Integer, default=0)
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="logs_treino")
    series = relationship("LogSerie", back_populates="log_treino", cascade="all, delete-orphan")

    # Relacionamentos para reações e comentários
    reacoes = relationship("Reacao", back_populates="log_treino", cascade="all, delete-orphan")
    comentarios = relationship("Comentario", back_populates="log_treino", cascade="all, delete-orphan")

class LogSerie(Base):
    __tablename__ = "logs_series"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    log_treino_id = Column(Integer, ForeignKey("logs_treino.id", ondelete="CASCADE"), nullable=False)
    exercicio_id = Column(Integer, ForeignKey("exercicios.id", ondelete="CASCADE"), nullable=False)
    peso = Column(DECIMAL(6, 2), nullable=False, default=0.00)
    repeticoes = Column(Integer, nullable=False, default=0)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    e_recorde_peso = Column(Boolean, default=False)
    e_recorde_reps = Column(Boolean, default=False)
    
    # Relacionamentos
    log_treino = relationship("LogTreino", back_populates="series")
    exercicio = relationship("Exercicio")

class Amizade(Base):
    __tablename__ = "amizades"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    solicitante_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    receptor_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum('pendente', 'aceito', 'recusado', 'bloqueado'), default='pendente', nullable=False)
    data_criacao = Column(TIMESTAMP, server_default=func.now())
    
    # Relacionamentos
    solicitante = relationship("Usuario", foreign_keys=[solicitante_id], back_populates="amizades_enviadas")
    receptor = relationship("Usuario", foreign_keys=[receptor_id], back_populates="amizades_recebidas")
    
    __table_args__ = (UniqueConstraint('solicitante_id', 'receptor_id', name='uq_amizade_solicitante_receptor'),)


class RankingSemanal(Base):
    __tablename__ = "ranking_semanal"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    
    pontos_totais = Column(Integer, default=0, nullable=False)
    semana = Column(Integer, nullable=False) # Ex: 42 (a 42ª semana do ano)
    ano = Column(Integer, nullable=False)   # Ex: 2025
    
    # Relacionamento
    usuario = relationship("Usuario", back_populates="rankings_semanais")
    
    # Um usuário só pode ter um registro por semana/ano
    __table_args__ = (UniqueConstraint('usuario_id', 'semana', 'ano', name='uq_ranking_usuario_semana_ano'),)


class Reacao(Base):
    __tablename__ = "reacoes"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    log_treino_id = Column(Integer, ForeignKey("logs_treino.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(50), default="props", nullable=False) # Ex: 'props', 'like'
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="reacoes")
    log_treino = relationship("LogTreino", back_populates="reacoes")
    
    # Um usuário só pode reagir uma vez a um treino
    __table_args__ = (UniqueConstraint('usuario_id', 'log_treino_id', name='uq_reacao_usuario_treino'),)

class Comentario(Base):
    __tablename__ = "comentarios"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    log_treino_id = Column(Integer, ForeignKey("logs_treino.id", ondelete="CASCADE"), nullable=False)
    texto = Column(String(280), nullable=False)
    data_criacao = Column(TIMESTAMP, server_default=func.now())
    
    # Relacionamentos
    usuario = relationship("Usuario", back_populates="comentarios")
    log_treino = relationship("LogTreino", back_populates="comentarios")