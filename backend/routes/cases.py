"""
Cases API Routes.

Provides endpoints for case retrieval, metadata,
and system health checks.
"""

import logging
from flask import Blueprint, request, jsonify

from backend.database import mongo
from backend.models import similarity

logger = logging.getLogger(__name__)

cases_bp = Blueprint("cases", __name__)

# In-memory case data cache (set from app.py)
_cases_cache = []


def set_cases_cache(cases):
    """Set the in-memory case data."""
    global _cases_cache
    _cases_cache = cases


@cases_bp.route("/api/cases", methods=["GET"])
def list_cases():
    """
    List all available cases.

    Query params:
    - limit: max results (default 50)
    - type: filter by case type
    - year_from: minimum year
    - year_to: maximum year
    """
    limit = min(int(request.args.get("limit", 50)), 100)
    case_type = request.args.get("type", "")
    year_from = request.args.get("year_from", type=int)
    year_to = request.args.get("year_to", type=int)

    results = []
    for case in _cases_cache:
        if case_type and case.get("case_type", "").lower() != case_type.lower():
            continue
        if year_from and case["year"] < year_from:
            continue
        if year_to and case["year"] > year_to:
            continue

        results.append({
            "id": case["id"],
            "title": case["title"],
            "year": case["year"],
            "citation": case.get("citation", ""),
            "case_type": case.get("case_type", ""),
            "author": case.get("author", ""),
            "bench_size": case.get("bench_size", 0),
        })

        if len(results) >= limit:
            break

    return jsonify({
        "cases": results,
        "total": len(results),
    })


@cases_bp.route("/api/cases/<int:case_id>", methods=["GET"])
def get_case(case_id):
    """Get full details for a specific case by ID."""
    case = next((c for c in _cases_cache if c["id"] == case_id), None)

    if case is None:
        return jsonify({"error": f"Case {case_id} not found"}), 404

    return jsonify(case)


@cases_bp.route("/api/health", methods=["GET"])
def health_check():
    """System health check endpoint."""
    index_stats = similarity.get_index_stats()

    return jsonify({
        "status": "ok",
        "database": {
            "mongodb": "connected" if mongo.is_connected() else "disconnected",
            "total_cases": mongo.count_cases() if mongo.is_connected() else len(_cases_cache),
        },
        "search_index": index_stats,
        "mode": "database" if mongo.is_connected() else "file-based",
    })


@cases_bp.route("/api/stats", methods=["GET"])
def get_stats():
    """Get application statistics."""
    case_types = {}
    year_range = [9999, 0]

    for case in _cases_cache:
        ct = case.get("case_type", "Other")
        case_types[ct] = case_types.get(ct, 0) + 1
        year_range[0] = min(year_range[0], case["year"])
        year_range[1] = max(year_range[1], case["year"])

    return jsonify({
        "total_cases": len(_cases_cache),
        "case_types": case_types,
        "year_range": {
            "from": year_range[0] if _cases_cache else 0,
            "to": year_range[1] if _cases_cache else 0,
        },
        "index": similarity.get_index_stats(),
    })
