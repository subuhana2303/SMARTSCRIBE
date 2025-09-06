from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User models
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    access_token: Optional[str] = None

# Content models
class ContentResponse(BaseModel):
    id: str
    title: str
    content_type: str
    summary: str
    language: str
    created_at: datetime

class ContentDetailResponse(ContentResponse):
    transcript: str

class TranslationRequest(BaseModel):
    target_language: str

# Quiz models
class QuestionOption(BaseModel):
    option: str
    text: str

class Question(BaseModel):
    question: str
    options: List[QuestionOption]
    correct_answer: str

class QuizRequest(BaseModel):
    num_questions: int = 5
    difficulty: str = "medium"

class QuizResponse(BaseModel):
    id: str
    content_id: str
    questions: List[Question]
    created_at: datetime

class QuizSubmission(BaseModel):
    answers: List[str]

# Q&A models
class QuestionRequest(BaseModel):
    question: str
    content_id: Optional[str] = None

# Token model
class Token(BaseModel):
    access_token: str
    token_type: str
