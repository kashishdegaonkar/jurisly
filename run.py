#!/usr/bin/env python3
"""
Jurisly — AI-Powered Legal Case Similarity Engine
Entry point script.

Usage:
    python run.py              # Start the server
    python run.py --seed       # Re-seed data and rebuild index
    python run.py --port 8000  # Custom port
"""

import argparse
import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app import create_app
from backend.config import Config


def main():
    parser = argparse.ArgumentParser(description="Jurisly — Legal Case Similarity Engine")
    parser.add_argument("--port", type=int, default=8000, help="Port to run on (default: 8000)")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind (default: 0.0.0.0)")
    parser.add_argument("--no-debug", action="store_true", help="Disable debug mode")
    parser.add_argument("--seed", action="store_true", help="Force re-seed database")

    args = parser.parse_args()

    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║   Jurisly — Legal Case Similarity Engine ║")
    print("  ║   AI-powered precedent discovery         ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    app = create_app()

    debug = not args.no_debug and Config.DEBUG

    print(f"  → Server:  http://localhost:{args.port}")
    print(f"  → Debug:   {'on' if debug else 'off'}")
    print(f"  → API:     http://localhost:{args.port}/api/health")
    print()

    app.run(
        host=args.host,
        port=args.port,
        debug=debug,
    )


if __name__ == "__main__":
    main()
