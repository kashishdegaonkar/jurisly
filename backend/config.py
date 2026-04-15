import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "jurisly-dev-secret-key-change-in-prod")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "jurisly")

    # BERT Model
    BERT_MODEL_NAME = os.getenv("BERT_MODEL_NAME", "nlpaueb/legal-bert-base-uncased")
    MAX_TOKEN_LENGTH = int(os.getenv("MAX_TOKEN_LENGTH", "512"))

    # FAISS
    FAISS_INDEX_PATH = os.getenv(
        "FAISS_INDEX_PATH",
        os.path.join(os.path.dirname(__file__), "..", "data", "faiss_index.bin"),
    )

    # Data
    SAMPLE_DATA_PATH = os.getenv(
        "SAMPLE_DATA_PATH",
        os.path.join(os.path.dirname(__file__), "..", "data", "sample_cases.json"),
    )

    # Search
    TOP_K_RESULTS = int(os.getenv("TOP_K_RESULTS", "10"))

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
