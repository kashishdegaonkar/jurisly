"""
Legal Text Preprocessor.

Cleans and normalizes legal text for processing by the BERT model.
Handles Indian legal document conventions and judicial language.
"""

import re
import logging

logger = logging.getLogger(__name__)

# Common legal stop phrases that add noise
LEGAL_STOP_PHRASES = [
    "hon'ble", "honourable", "learned counsel",
    "in the matter of", "in re", "inter alia",
    "the petitioner submits", "it is submitted that",
    "may it please", "with respect",
]

# Indian court abbreviations
COURT_ABBREVIATIONS = {
    "SC": "Supreme Court",
    "HC": "High Court",
    "AIR": "All India Reporter",
    "SCC": "Supreme Court Cases",
    "SCR": "Supreme Court Reports",
    "Cr.P.C.": "Code of Criminal Procedure",
    "C.P.C.": "Code of Civil Procedure",
    "I.P.C.": "Indian Penal Code",
}


def preprocess(text):
    """
    Clean and normalize legal text for model input.

    Steps:
    1. Strip whitespace and normalize line breaks
    2. Remove case numbering artifacts
    3. Normalize citations
    4. Clean special characters
    5. Normalize spacing

    Args:
        text: Raw legal text string

    Returns:
        Cleaned text string
    """
    if not text or not isinstance(text, str):
        return ""

    # Normalize whitespace and line breaks
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove page numbers and headers (e.g., "Page 3 of 45")
    text = re.sub(r"Page\s+\d+\s+(of|/)\s+\d+", "", text, flags=re.IGNORECASE)

    # Remove case numbering artifacts (e.g., "SLP(C) No. 1234/2020")
    text = re.sub(r"\b[A-Z]{2,}\(?\w?\)?\s*No\.?\s*\d+[\s/]*\d*\b", "", text)

    # Normalize multiple spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Clean up common OCR artifacts
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    text = re.sub(r"[^\x00-\x7F]+", lambda m: m.group() if any(ord(c) > 127 for c in m.group()) else " ", text)

    # Trim
    text = text.strip()

    return text


def extract_citations(text):
    """
    Extract legal citations from text.

    Patterns recognized:
    - AIR YYYY SC NNNN
    - (YYYY) N SCC NNN
    - YYYY SCR NNN

    Args:
        text: Legal text string

    Returns:
        List of citation strings found
    """
    citations = []

    # AIR citations: AIR 1973 SC 1461
    air_pattern = r"AIR\s+\d{4}\s+[A-Z]{2,4}\s+\d+"
    citations.extend(re.findall(air_pattern, text))

    # SCC citations: (2019) 5 SCC 1
    scc_pattern = r"\(\d{4}\)\s+\d+\s+SCC\s+\d+"
    citations.extend(re.findall(scc_pattern, text))

    # SCR citations
    scr_pattern = r"\d{4}\s+SCR\s+\d+"
    citations.extend(re.findall(scr_pattern, text))

    return list(set(citations))


def extract_articles(text):
    """
    Extract constitutional article references from text.

    Args:
        text: Legal text string

    Returns:
        List of article references (e.g., ["Article 14", "Article 21"])
    """
    pattern = r"Article\s+\d+[A-Za-z]?"
    articles = re.findall(pattern, text, re.IGNORECASE)
    return list(set(a.title() for a in articles))


def extract_acts(text):
    """
    Extract Act references from text.

    Args:
        text: Legal text string

    Returns:
        List of Act names
    """
    # Match patterns like "... Act, 1950" or "... Act 1950"
    pattern = r"[A-Z][A-Za-z\s]+Act[,]?\s*\d{4}"
    acts = re.findall(pattern, text)
    return list(set(acts))


def truncate_for_bert(text, max_words=400):
    """
    Truncate text to approximately fit within BERT's token limit.
    Uses word count as a rough proxy for token count.

    Args:
        text: Input text
        max_words: Maximum number of words

    Returns:
        Truncated text
    """
    words = text.split()
    if len(words) <= max_words:
        return text

    return " ".join(words[:max_words])


def split_into_segments(text, segment_size=200):
    """
    Split long text into overlapping segments for processing.

    Args:
        text: Input text
        segment_size: Words per segment

    Returns:
        List of text segments
    """
    words = text.split()
    segments = []
    stride = segment_size // 2  # 50% overlap

    for i in range(0, len(words), stride):
        segment = " ".join(words[i : i + segment_size])
        if segment.strip():
            segments.append(segment)

        if i + segment_size >= len(words):
            break

    return segments if segments else [text]
