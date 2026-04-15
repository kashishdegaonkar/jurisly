"""
Jurisly — Flask Application.

Main entry point for the backend server.
Serves the frontend, provides API endpoints for case search,
and initializes the BERT + FAISS pipeline.
"""

import os
import logging
from flask import Flask, send_from_directory
from flask_cors import CORS

from backend.config import Config
from backend.database import mongo, seed
from backend.database.seed import get_cases_from_file
from backend.models import bert_model, similarity
from backend.routes.search import search_bp, set_cases_cache as set_search_cache
from backend.routes.cases import cases_bp, set_cases_cache as set_cases_route_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("jurisly")


def create_app():
    """Create and configure the Flask application."""

    # Resolve paths
    project_root = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(project_root, "frontend")

    app = Flask(
        __name__,
        static_folder=frontend_dir,
        static_url_path="",
    )

    # Load config
    app.config.from_object(Config)

    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})

    # Register API blueprints
    app.register_blueprint(search_bp)
    app.register_blueprint(cases_bp)

    # --- Initialize services ---
    with app.app_context():
        _init_services(app)

    # --- Frontend routes ---
    @app.route("/")
    def serve_frontend():
        return send_from_directory(frontend_dir, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        file_path = os.path.join(frontend_dir, path)
        if os.path.exists(file_path):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, "index.html")

    logger.info("Jurisly application ready")
    return app


def _init_services(app):
    """Initialize database, model, and search index."""

    # 1. Connect to MongoDB (optional — works without it)
    mongo_connected = mongo.connect(
        uri=app.config["MONGO_URI"],
        db_name=app.config["MONGO_DB_NAME"],
    )

    if mongo_connected:
        logger.info("MongoDB connected")
    else:
        logger.info("Running without MongoDB — using file-based data")

    # 2. Load case data
    data_path = os.path.abspath(app.config["SAMPLE_DATA_PATH"])
    cases = get_cases_from_file(data_path)
    logger.info(f"Loaded {len(cases)} cases from data file")

    # 3. Set case cache for routes
    set_search_cache(cases)
    set_cases_route_cache(cases)

    # 4. Seed database and build FAISS index
    seed.seed_database(data_path, mongo, bert_model, similarity)

    logger.info("All services initialized")


# Run directly
if __name__ == "__main__":
    app = create_app()
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=Config.DEBUG,
    )
