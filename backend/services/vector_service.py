import json
import os
from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class VectorService:
    def __init__(self):
        self.storage_path = "vector_storage"
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self.documents = {}
        self.vectors = None
        self.fitted = False
        
        # Create storage directory
        os.makedirs(self.storage_path, exist_ok=True)
        
        # Load existing data
        self.load_data()
    
    def load_data(self):
        """Load existing vector data."""
        try:
            docs_path = os.path.join(self.storage_path, "documents.json")
            vectors_path = os.path.join(self.storage_path, "vectors.npy")
            vectorizer_path = os.path.join(self.storage_path, "vectorizer.json")
            
            if os.path.exists(docs_path):
                with open(docs_path, 'r', encoding='utf-8') as f:
                    self.documents = json.load(f)
            
            if os.path.exists(vectors_path) and os.path.exists(vectorizer_path):
                self.vectors = np.load(vectors_path)
                
                # Load vectorizer vocabulary
                with open(vectorizer_path, 'r', encoding='utf-8') as f:
                    vectorizer_data = json.load(f)
                    self.vectorizer.vocabulary_ = vectorizer_data.get('vocabulary', {})
                    self.fitted = True
                    
        except Exception as e:
            print(f"Error loading vector data: {e}")
            self.documents = {}
            self.vectors = None
            self.fitted = False
    
    def save_data(self):
        """Save vector data to disk."""
        try:
            docs_path = os.path.join(self.storage_path, "documents.json")
            vectors_path = os.path.join(self.storage_path, "vectors.npy")
            vectorizer_path = os.path.join(self.storage_path, "vectorizer.json")
            
            # Save documents
            with open(docs_path, 'w', encoding='utf-8') as f:
                json.dump(self.documents, f, ensure_ascii=False, indent=2)
            
            # Save vectors
            if self.vectors is not None:
                np.save(vectors_path, self.vectors)
            
            # Save vectorizer
            if self.fitted:
                vectorizer_data = {
                    'vocabulary': self.vectorizer.vocabulary_
                }
                with open(vectorizer_path, 'w', encoding='utf-8') as f:
                    json.dump(vectorizer_data, f, indent=2)
                    
        except Exception as e:
            print(f"Error saving vector data: {e}")
    
    async def store_content(self, content_id: str, transcript: str, summary: str):
        """Store content in vector database."""
        try:
            # Combine transcript and summary for better retrieval
            combined_text = f"{summary}\n\n{transcript}"
            
            self.documents[content_id] = {
                'transcript': transcript,
                'summary': summary,
                'combined_text': combined_text
            }
            
            # Rebuild vectors with all documents
            self.rebuild_vectors()
            
            # Save to disk
            self.save_data()
            
        except Exception as e:
            print(f"Error storing content: {e}")
    
    def rebuild_vectors(self):
        """Rebuild the vector index with all documents."""
        if not self.documents:
            return
        
        try:
            texts = [doc['combined_text'] for doc in self.documents.values()]
            self.vectors = self.vectorizer.fit_transform(texts)
            self.fitted = True
            
        except Exception as e:
            print(f"Error rebuilding vectors: {e}")
    
    async def query(self, question: str, user_id: str = None) -> str:
        """Query the vector database for relevant content."""
        try:
            if not self.documents or not self.fitted:
                return "I don't have enough information to answer your question. Please upload some content first."
            
            # Vectorize the question
            question_vector = self.vectorizer.transform([question])
            
            # Calculate similarities
            similarities = cosine_similarity(question_vector, self.vectors).flatten()
            
            # Get the most similar document
            best_match_idx = np.argmax(similarities)
            best_similarity = similarities[best_match_idx]
            
            if best_similarity < 0.1:  # Threshold for relevance
                return "I couldn't find relevant information to answer your question. Try rephrasing or ask about the uploaded content."
            
            # Get the document
            doc_id = list(self.documents.keys())[best_match_idx]
            document = self.documents[doc_id]
            
            # Generate answer based on the most relevant content
            answer = self.generate_answer(question, document['summary'], document['transcript'])
            
            return answer
            
        except Exception as e:
            return f"Error processing your question: {str(e)}"
    
    def generate_answer(self, question: str, summary: str, transcript: str) -> str:
        """Generate an answer based on the question and content."""
        # Simple keyword-based answer generation
        question_lower = question.lower()
        
        # Look for relevant sentences in summary first, then transcript
        content_to_search = [summary, transcript]
        
        for content in content_to_search:
            sentences = content.split('.')
            
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) < 10:
                    continue
                
                # Check if sentence contains relevant keywords
                if any(word in sentence.lower() for word in question_lower.split() if len(word) > 3):
                    return f"Based on the content: {sentence}."
        
        # Fallback to summary
        return f"Based on the uploaded content: {summary[:200]}..."
