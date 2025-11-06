from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Carrega as variáveis de ambiente do arquivo .env
    """
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    @property
    def DATABASE_URL(self) -> str:
        """
        Gera a URL de conexão do SQLAlchemy para o MySQL.
        AGORA USANDO O DRIVER 'pymysql'.
        """
        # O formato mudou para mysql+pymysql
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Carrega as variáveis do arquivo .env
    model_config = SettingsConfigDict(env_file=".env")

# Instância global das configurações
settings = Settings()

