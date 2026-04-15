"""
MongoDB Connection Manager.

Handles connection pooling, database operations,
and case document CRUD for the Jurisly application.
"""

import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger(__name__)

_client = None
_db = None


def connect(uri="mongodb://localhost:27017", db_name="jurisly"):
    """
    Establish connection to MongoDB.

    Args:
        uri: MongoDB connection string
        db_name: Database name

    Returns:
        True if connection successful, False otherwise
    """
    global _client, _db

    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _client.admin.command("ping")
        _db = _client[db_name]
        logger.info(f"Connected to MongoDB: {db_name}")
        return True

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.warning(f"MongoDB not available: {e}")
        logger.warning("Running in file-based mode (no database)")
        _client = None
        _db = None
        return False


def get_db():
    """Return the database instance."""
    return _db


def get_collection(name="cases"):
    """Return a collection from the database."""
    if _db is None:
        return None
    return _db[name]


def insert_case(case_data):
    """Insert a single case document."""
    collection = get_collection("cases")
    if collection is None:
        return None

    result = collection.insert_one(case_data)
    return str(result.inserted_id)


def insert_cases(cases_list):
    """Insert multiple case documents."""
    collection = get_collection("cases")
    if collection is None:
        return []

    result = collection.insert_many(cases_list)
    return [str(id) for id in result.inserted_ids]


def find_case(case_id):
    """Find a single case by its ID field."""
    collection = get_collection("cases")
    if collection is None:
        return None

    return collection.find_one({"id": case_id}, {"_id": 0})


def find_cases(query=None, limit=50):
    """Find cases matching a query."""
    collection = get_collection("cases")
    if collection is None:
        return []

    query = query or {}
    cursor = collection.find(query, {"_id": 0}).limit(limit)
    return list(cursor)


def count_cases():
    """Return total number of cases in the database."""
    collection = get_collection("cases")
    if collection is None:
        return 0

    return collection.count_documents({})


def case_exists(case_id):
    """Check if a case with the given ID exists."""
    collection = get_collection("cases")
    if collection is None:
        return False

    return collection.count_documents({"id": case_id}) > 0


def drop_cases():
    """Drop all cases (for reseeding)."""
    collection = get_collection("cases")
    if collection is None:
        return

    collection.drop()
    logger.info("Cases collection dropped")


def is_connected():
    """Check if MongoDB connection is active."""
    return _db is not None
