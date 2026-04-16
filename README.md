# Jurisly — Legal Case Similarity Engine

Jurisly is a full-stack application that enables smart legal case search by analyzing the meaning of text instead of just keywords, using a Flask backend with BERT for embeddings and FAISS for efficient similarity retrieval, along with a clean frontend for user interaction.

## Prerequisites
- Python 3.9+
- MongoDB (optional, falls back to in-memory file storage if not available)

## Setup & Running

1. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install backend dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Run the application:**
   ```bash
   python run.py
   ```
   *(The first time you run it, it will automatically download the BERT model and build the FAISS index, which might take a minute or two.)*

4. **Access the web interface:**
   Open your browser to: [http://localhost:5000](http://localhost:5000)

## Project Structure
- `backend/`: Flask server, matching engine (BERT + FAISS), and API routes.
- `frontend/`: The UI files (`index.html`, CSS, JS) served by Flask.
- `data/`: Contains `sample_cases.json` for seeding the database.
- `run.py`: The main entry point to start the server.
