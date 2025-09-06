import numpy as np
from .db_config import load_index
from .embedding_utils import embed_text

def retrieve(query, top_k=3):
    index, documents = load_index()
    if len(documents) == 0:
        return []

    query_vec = embed_text([query])
    distances, indices = index.search(query_vec, top_k)

    results = []
    for i, idx in enumerate(indices[0]):
        if idx < len(documents):
            results.append({
                "document": documents[idx],
                "score": float(distances[0][i])
            })
    return results
