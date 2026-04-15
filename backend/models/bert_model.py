"""
BERT Model for Legal Text Understanding.

Uses a pre-trained Legal-BERT model to generate contextual representations
of legal text for similarity comparison.
"""

import logging
import numpy as np

logger = logging.getLogger(__name__)

# Lazy-loaded globals
_tokenizer = None
_model = None
_device = None


def _load_model(model_name="nlpaueb/legal-bert-base-uncased"):
    """Load the BERT model and tokenizer (lazy initialization)."""
    global _tokenizer, _model, _device

    if _model is not None:
        return

    try:
        import torch
        from transformers import AutoTokenizer, AutoModel

        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Loading BERT model: {model_name} on {_device}")

        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModel.from_pretrained(model_name).to(_device)
        _model.eval()

        logger.info("BERT model loaded successfully")

    except Exception as e:
        logger.warning(f"Could not load BERT model: {e}")
        logger.warning("Falling back to TF-IDF based representations")
        _model = "fallback"


def get_embedding(text, model_name="nlpaueb/legal-bert-base-uncased", max_length=512):
    """
    Generate a vector representation for the given legal text.

    Args:
        text: Input legal text string
        model_name: HuggingFace model identifier
        max_length: Maximum token length for BERT

    Returns:
        numpy array of shape (768,) — the text representation
    """
    _load_model(model_name)

    if _model == "fallback" or _model is None:
        return _fallback_embedding(text)

    try:
        import torch

        inputs = _tokenizer(
            text,
            return_tensors="pt",
            max_length=max_length,
            truncation=True,
            padding=True,
        ).to(_device)

        with torch.no_grad():
            outputs = _model(**inputs)

        # Use [CLS] token representation (first token)
        cls_embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy().flatten()

        # L2 normalize
        norm = np.linalg.norm(cls_embedding)
        if norm > 0:
            cls_embedding = cls_embedding / norm

        return cls_embedding

    except Exception as e:
        logger.error(f"BERT encoding failed: {e}")
        return _fallback_embedding(text)


def get_batch_embeddings(texts, model_name="nlpaueb/legal-bert-base-uncased", max_length=512, batch_size=8):
    """
    Generate representations for multiple texts in batches.

    Args:
        texts: List of text strings
        model_name: HuggingFace model identifier
        max_length: Maximum token length
        batch_size: Number of texts per batch

    Returns:
        numpy array of shape (n_texts, 768)
    """
    _load_model(model_name)

    if _model == "fallback" or _model is None:
        return np.array([_fallback_embedding(t) for t in texts])

    try:
        import torch

        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            inputs = _tokenizer(
                batch,
                return_tensors="pt",
                max_length=max_length,
                truncation=True,
                padding=True,
            ).to(_device)

            with torch.no_grad():
                outputs = _model(**inputs)

            cls_embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
            all_embeddings.append(cls_embeddings)

            logger.info(f"Processed batch {i // batch_size + 1}/{(len(texts) - 1) // batch_size + 1}")

        embeddings = np.vstack(all_embeddings)

        # L2 normalize each vector
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1
        embeddings = embeddings / norms

        return embeddings

    except Exception as e:
        logger.error(f"Batch BERT encoding failed: {e}")
        return np.array([_fallback_embedding(t) for t in texts])


def _fallback_embedding(text, dim=768):
    """
    Generate a simple TF-IDF-style hash-based representation as fallback
    when BERT is not available.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer

    # Create a simple representation using character n-grams
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        max_features=dim,
    )

    try:
        vec = vectorizer.fit_transform([text]).toarray().flatten()
    except Exception:
        vec = np.zeros(dim)

    # Pad or truncate to target dimension
    if len(vec) < dim:
        vec = np.pad(vec, (0, dim - len(vec)))
    else:
        vec = vec[:dim]

    # L2 normalize
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return vec
