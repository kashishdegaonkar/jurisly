"""
Database Seeder.

Loads sample case data from JSON into MongoDB
and builds the FAISS index for similarity search.
"""

import json
import logging
import os
import numpy as np

logger = logging.getLogger(__name__)


def seed_database(data_path, mongo_module, bert_module, similarity_module):
    """
    Seed the database with sample cases and build the search index.

    Args:
        data_path: Path to sample_cases.json
        mongo_module: The mongo database module
        bert_module: The BERT model module
        similarity_module: The FAISS similarity module

    Returns:
        Number of cases seeded
    """
    # Load case data via helper function to support CSV and JSON seamlessly
    cases = get_cases_from_file(data_path)
    
    if not cases:
        logger.error(f"No cases loaded from: {data_path}")
        return 0

    logger.info(f"Seeding {len(cases)} cases")

    # Insert into MongoDB if connected
    if mongo_module.is_connected():
        existing = mongo_module.count_cases()
        if existing >= len(cases):
            logger.info(f"Database already has {existing} cases — skipping insert")
        else:
            mongo_module.drop_cases()
            mongo_module.insert_cases(cases)
            logger.info(f"Inserted {len(cases)} cases into MongoDB")

    # Build FAISS index
    _build_index(cases, bert_module, similarity_module)

    return len(cases)


def _build_index(cases, bert_module, similarity_module):
    """Generate embeddings and build the FAISS index."""
    logger.info("Building search index...")

    # Prepare text for embedding — combine key fields
    texts = []
    case_ids = []

    for case in cases:
        # Combine title, snippet, and full_text for richer representation
        combined = " ".join(
            filter(None, [
                case.get("title", ""),
                case.get("snippet", "").replace("<mark>", "").replace("</mark>", ""),
                case.get("full_text", ""),
                case.get("judges", ""),
                case.get("case_type", ""),
            ])
        )
        texts.append(combined)
        case_ids.append(case["id"])

    # Generate embeddings
    try:
        embeddings = bert_module.get_batch_embeddings(texts)
        logger.info(f"Generated embeddings: shape={embeddings.shape}")
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        # Create random embeddings as fallback for demo
        import numpy as np
        embeddings = np.random.randn(len(texts), 768).astype(np.float32)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = embeddings / norms
        logger.warning("Using random embeddings as fallback")

    # Build FAISS index
    similarity_module.build_index(embeddings, case_ids)
    logger.info("Search index built successfully")


def get_cases_from_file(data_path, max_cases=500):
    """Load cases from JSON or CSV file."""
    if not os.path.exists(data_path):
        # Fallback to CSV if json not found or directory is provided
        csv_path = os.path.join(os.path.dirname(data_path), "judgments.csv")
        if os.path.exists(csv_path):
            data_path = csv_path
        else:
            return []

    if data_path.endswith(".json"):
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)

    # Handle Kaggle CSV format
    if data_path.endswith(".csv"):
        import csv
        cases = []
        with open(data_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= max_cases:
                    break

                try:
                    # Extract year from date or diary_no
                    year = 2000
                    date_val = row.get("judgment_dates", "")
                    if date_val and len(date_val) >= 4:
                        year = int(date_val.split("-")[-1])
                    
                    bench = str(row.get("bench", "")).replace("HON'BLE ", "").replace("MR. ", "").replace("JUSTICE ", "")
                    
                    case = {
                        "id": i + 1,
                        "title": f"{row.get('pet', 'Unknown')} v. {row.get('res', 'Unknown')}",
                        "petitioner": row.get("pet", "Unknown"),
                        "respondent": row.get("res", "Unknown"),
                        "year": year,
                        "citation": row.get("case_no", row.get("diary_no", "")).strip(),
                        "disposal": "Disposed",
                        "bench_size": len(bench.split(",")) if bench else 1,
                        "judges": bench,
                        "author": row.get("judgement_by", "").replace("HON'BLE MR. JUSTICE ", ""),
                        "case_type": row.get("Judgement_type", "J"),
                        "snippet": f"Case involving {row.get('pet', '')} and {row.get('res', '')} decided by {row.get('judgement_by', '')}.",
                        "full_text": f"This is a {row.get('Judgement_type', 'judgment')} regarding diary number {row.get('diary_no', '')}.",
                        "segments": [],
                        "acts": []
                    }
                    cases.append(case)
                except Exception as e:
                    logger.warning(f"Error parsing row {i}: {e}")
                    continue
        
        logger.info(f"Loaded {len(cases)} cases from CSV (capped at {max_cases} to prevent CPU overload)")
        return cases

