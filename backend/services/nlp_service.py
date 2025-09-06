import re
from typing import List
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

class NLPService:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
    
    def preprocess_text(self, text: str) -> str:
        """Clean and preprocess text."""
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text.strip())
        return text
    
    def extract_sentences(self, text: str) -> List[str]:
        """Extract sentences from text."""
        sentences = sent_tokenize(text)
        return [self.preprocess_text(sent) for sent in sentences if len(sent.strip()) > 10]
    
    async def generate_summary(self, text: str, num_sentences: int = 3) -> str:
        """Generate extractive summary using TF-IDF and cosine similarity."""
        try:
            # Preprocess text
            text = self.preprocess_text(text)
            sentences = self.extract_sentences(text)
            
            if len(sentences) <= num_sentences:
                return '. '.join(sentences)
            
            # Create TF-IDF vectors
            vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
            tfidf_matrix = vectorizer.fit_transform(sentences)
            
            # Calculate sentence scores based on average TF-IDF scores
            sentence_scores = np.mean(tfidf_matrix.toarray(), axis=1)
            
            # Get top sentences
            top_indices = sentence_scores.argsort()[-num_sentences:][::-1]
            top_indices.sort()  # Maintain original order
            
            summary_sentences = [sentences[i] for i in top_indices]
            return '. '.join(summary_sentences) + '.'
            
        except Exception as e:
            # Fallback to simple truncation
            sentences = self.extract_sentences(text)
            return '. '.join(sentences[:num_sentences]) + '.'
    
    def extract_keywords(self, text: str, num_keywords: int = 10) -> List[str]:
        """Extract keywords using TF-IDF."""
        try:
            vectorizer = TfidfVectorizer(stop_words='english', max_features=num_keywords)
            tfidf_matrix = vectorizer.fit_transform([text])
            
            feature_names = vectorizer.get_feature_names_out()
            tfidf_scores = tfidf_matrix.toarray()[0]
            
            # Get keywords sorted by score
            keyword_scores = list(zip(feature_names, tfidf_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [keyword for keyword, score in keyword_scores]
            
        except Exception:
            # Fallback to simple word frequency
            words = word_tokenize(text.lower())
            words = [word for word in words if word.isalpha() and word not in self.stop_words]
            
            word_freq = {}
            for word in words:
                word_freq[word] = word_freq.get(word, 0) + 1
            
            sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
            return [word for word, freq in sorted_words[:num_keywords]]
