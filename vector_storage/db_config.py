import faiss
import numpy as np
import os

INDEX_FILE = os.path.join(os.path.dirname(__file__), "faiss_index.bin")
DOCS_FILE = os.path.join(os.path.dirname(__file__), "documents.npy")

def create_index(dimension=384):
    return faiss.IndexFlatL2(dimension)

def save_index(index, documents):
    faiss.write_index(index, INDEX_FILE)
    np.save(DOCS_FILE, documents)

def load_index():
    if os.path.exists(INDEX_FILE) and os.path.exists(DOCS_FILE):
        index = faiss.read_index(INDEX_FILE)
        documents = np.load(DOCS_FILE, allow_pickle=True)
        return index, documents
    else:
        return create_index(), []
