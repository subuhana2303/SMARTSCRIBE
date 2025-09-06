import random
import re
from typing import List, Dict, Any
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords

class QuizService:
    def __init__(self):
        self.question_templates = [
            "What is {topic}?",
            "Which of the following best describes {topic}?",
            "According to the content, {topic} is:",
            "The main purpose of {topic} is to:",
            "What can be concluded about {topic}?"
        ]
    
    def extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text for quiz generation."""
        sentences = sent_tokenize(text)
        concepts = []
        
        # Look for sentences with key indicators
        key_indicators = [
            r"is defined as",
            r"refers to",
            r"means that",
            r"is a",
            r"are",
            r"include",
            r"such as",
            r"for example"
        ]
        
        for sentence in sentences:
            for indicator in key_indicators:
                if re.search(indicator, sentence, re.IGNORECASE):
                    # Extract the concept (simplified approach)
                    words = word_tokenize(sentence)
                    if len(words) > 5:
                        concepts.append(sentence.strip())
                    break
        
        return concepts[:10]  # Limit to 10 concepts
    
    def generate_distractors(self, correct_answer: str, context: str) -> List[str]:
        """Generate plausible wrong answers."""
        # Simple distractor generation
        distractors = [
            f"Alternative explanation of {correct_answer.split()[0] if correct_answer.split() else 'the concept'}",
            f"Different approach to {correct_answer.split()[-1] if correct_answer.split() else 'the topic'}",
            f"Opposite of {correct_answer.split()[0] if correct_answer.split() else 'the main idea'}"
        ]
        
        return distractors[:3]
    
    async def generate_quiz(self, content: str, num_questions: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
        """Generate a quiz from content."""
        try:
            concepts = self.extract_key_concepts(content)
            
            if len(concepts) < num_questions:
                num_questions = len(concepts)
            
            if num_questions == 0:
                # Fallback: generate basic questions
                return self.generate_fallback_quiz(content, num_questions)
            
            questions = []
            selected_concepts = random.sample(concepts, min(num_questions, len(concepts)))
            
            for i, concept in enumerate(selected_concepts):
                # Extract a simple answer from the concept sentence
                words = concept.split()
                if len(words) > 10:
                    # Take a meaningful portion as the correct answer
                    correct_answer = ' '.join(words[3:8])
                else:
                    correct_answer = concept
                
                # Generate question
                template = random.choice(self.question_templates)
                question_text = template.replace("{topic}", words[0] if words else "the main concept")
                
                # Generate options
                distractors = self.generate_distractors(correct_answer, content)
                options = [
                    {"option": "A", "text": correct_answer},
                    {"option": "B", "text": distractors[0]},
                    {"option": "C", "text": distractors[1]},
                    {"option": "D", "text": distractors[2]}
                ]
                
                # Shuffle options
                random.shuffle(options)
                
                # Find correct answer after shuffle
                correct_option = next(opt["option"] for opt in options if opt["text"] == correct_answer)
                
                questions.append({
                    "question": question_text,
                    "options": options,
                    "correct_answer": correct_option
                })
            
            return {"questions": questions}
            
        except Exception as e:
            return self.generate_fallback_quiz(content, num_questions)
    
    def generate_fallback_quiz(self, content: str, num_questions: int) -> Dict[str, Any]:
        """Generate a basic quiz when concept extraction fails."""
        questions = []
        
        for i in range(min(num_questions, 3)):
            question_text = f"Based on the content, which statement is most accurate?"
            
            options = [
                {"option": "A", "text": "The content provides comprehensive information on the topic"},
                {"option": "B", "text": "The content is primarily focused on theoretical concepts"},
                {"option": "C", "text": "The content emphasizes practical applications"},
                {"option": "D", "text": "The content covers introductory material"}
            ]
            
            questions.append({
                "question": question_text,
                "options": options,
                "correct_answer": "A"
            })
        
        return {"questions": questions}
