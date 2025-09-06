from sentence_transformers import SentenceTransformer

# Load lightweight model (fast and free)
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_embedding(text: str):
    """Convert text to vector embedding"""
    return model.encode([text])[0]
