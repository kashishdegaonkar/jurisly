"""
FAISS Similarity Search Engine.

Manages vector indexing and fast nearest-neighbor search
for legal case matching.
"""

import os
import json
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Lazy-loaded FAISS index
_index = None
_case_ids = []


def build_index(embeddings, case_ids):
    """
    Build a FAISS index from case embeddings.

    Args:
        embeddings: numpy array of shape (n_cases, dim)
        case_ids: list of case IDs corresponding to each embedding
    """
    global _index, _case_ids

    try:
        import faiss

        dim = embeddings.shape[1]
        _index = faiss.IndexFlatIP(dim)  # Inner product (cosine sim on normalized vectors)
        _index.add(embeddings.astype(np.float32))
        _case_ids = list(case_ids)

        logger.info(f"FAISS index built: {_index.ntotal} vectors, dim={dim}")

    except ImportError:
        logger.warning("FAISS not installed — using brute-force numpy search")
        _index = "numpy"
        _case_ids = list(case_ids)
        # Store embeddings for numpy fallback
        _build_numpy_index(embeddings, case_ids)


def _build_numpy_index(embeddings, case_ids):
    """Fallback: store embeddings in memory for numpy-based search."""
    global _numpy_embeddings
    _numpy_embeddings = embeddings.astype(np.float32)


def search(query_embedding, top_k=10):
    """
    Search for the most similar cases to the query.

    Args:
        query_embedding: numpy array of shape (dim,)
        top_k: number of results to return

    Returns:
        list of dicts with 'case_id' and 'score'
    """
    global _index, _case_ids

    if _index is None:
        logger.error("FAISS index not built yet")
        return []

    query = query_embedding.reshape(1, -1).astype(np.float32)

    if _index == "numpy":
        return _numpy_search(query, top_k)

    try:
        import faiss

        scores, indices = _index.search(query, min(top_k, _index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:
                continue
            results.append({
                "case_id": _case_ids[idx],
                "score": float(score),
            })

        return results

    except Exception as e:
        logger.error(f"FAISS search failed: {e}")
        return []


def _numpy_search(query, top_k):
    """Fallback brute-force search using numpy dot product."""
    global _numpy_embeddings, _case_ids

    scores = np.dot(_numpy_embeddings, query.flatten())
    top_indices = np.argsort(scores)[::-1][:top_k]

    return [
        {"case_id": _case_ids[i], "score": float(scores[i])}
        for i in top_indices
    ]


def save_index(path):
    """Save the FAISS index to disk."""
    global _index

    if _index is None or _index == "numpy":
        logger.warning("No FAISS index to save")
        return False

    try:
        import faiss

        os.makedirs(os.path.dirname(path), exist_ok=True)
        faiss.write_index(_index, path)

        # Save case IDs alongside
        ids_path = path + ".ids.json"
        with open(ids_path, "w") as f:
            json.dump(_case_ids, f)

        logger.info(f"Index saved to {path}")
        return True

    except Exception as e:
        logger.error(f"Failed to save index: {e}")
        return False


def load_index(path):
    """Load a FAISS index from disk."""
    global _index, _case_ids

    if not os.path.exists(path):
        logger.warning(f"Index file not found: {path}")
        return False

    try:
        import faiss

        _index = faiss.read_index(path)

        ids_path = path + ".ids.json"
        if os.path.exists(ids_path):
            with open(ids_path) as f:
                _case_ids = json.load(f)

        logger.info(f"Index loaded: {_index.ntotal} vectors")
        return True

    except Exception as e:
        logger.error(f"Failed to load index: {e}")
        return False


def get_index_stats():
    """Return stats about the current index."""
    if _index is None:
        return {"status": "not_built", "total_vectors": 0}

    if _index == "numpy":
        return {
            "status": "numpy_fallback",
            "total_vectors": len(_case_ids),
        }

    return {
        "status": "faiss",
        "total_vectors": _index.ntotal,
        "dimension": _index.d,
    }
