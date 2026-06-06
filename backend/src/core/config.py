from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    SECRET_KEY: str = "super-secret-key-for-jwt"
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()