from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gut Health AI"
    API_V1_STR: str = "/api/v1"
    
    # Defaults to sqlite for local dev if Postgres isn't provided
    DATABASE_URL: str = "sqlite:///./gut_health.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
