from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from typing import Optional, List
from datetime import datetime

from models import *
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from services.nlp_service import NLPService
from services.translation_service import TranslationService
from services.quiz_service import QuizService
from services.vector_service import VectorService
from config import get_database

app = FastAPI(title="SmartScribe Pro", description="AI-Powered Learning Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
nlp_service = NLPService()
translation_service = TranslationService()
quiz_service = QuizService()
vector_service = VectorService()

# Mount static files for React app
app.mount("/src", StaticFiles(directory="src"), name="src")
app.mount("/attached_assets", StaticFiles(directory="attached_assets"), name="attached_assets")

# Serve uploaded files
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def read_root():
    return FileResponse("index.html")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Don't serve SPA for API routes or static files
    if full_path.startswith("api/") or full_path.startswith("src/") or full_path.startswith("uploads/") or full_path.startswith("attached_assets/"):
        raise HTTPException(status_code=404, detail="Not found")
    
    # For any other route, serve the React SPA
    return FileResponse("index.html")

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True
    }
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_data.email,
        full_name=user_data.full_name,
        is_active=True,
        created_at=user_dict["created_at"],
        access_token=access_token
    )

@app.post("/api/auth/login", response_model=UserResponse)
async def login(form_data: UserLogin):
    db = get_database()
    
    user = await db.users.find_one({"email": form_data.email})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": form_data.email})
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
        is_active=user["is_active"],
        created_at=user["created_at"],
        access_token=access_token
    )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

# Content processing endpoints
@app.post("/api/content/upload", response_model=ContentResponse)
async def upload_content(
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    title: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    if not file and not youtube_url:
        raise HTTPException(status_code=400, detail="Either file or YouTube URL is required")
    
    db = get_database()
    
    try:
        # Process content based on input type
        if file:
            # Save uploaded file
            file_path = f"uploads/{file.filename}"
            os.makedirs("uploads", exist_ok=True)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # For MVP, we'll mock the transcription
            transcript = "This is a mock transcript of the uploaded video content. In production, this would be generated using speech-to-text services."
            content_type = "upload"
            source_url = file_path
        else:
            # Process YouTube URL (mocked for MVP)
            transcript = "This is a mock transcript of the YouTube video content. In production, this would be extracted using YouTube API and speech-to-text services."
            content_type = "youtube"
            source_url = youtube_url
        
        # Generate summary
        summary = await nlp_service.generate_summary(transcript)
        
        # Store content in database
        content_doc = {
            "user_id": str(current_user["_id"]),
            "title": title,
            "content_type": content_type,
            "source_url": source_url,
            "transcript": transcript,
            "summary": summary,
            "created_at": datetime.utcnow(),
            "language": "en"
        }
        
        result = await db.content.insert_one(content_doc)
        
        # Store in vector database for RAG
        await vector_service.store_content(str(result.inserted_id), transcript, summary)
        
        return ContentResponse(
            id=str(result.inserted_id),
            title=title,
            content_type=content_type,
            summary=summary,
            language="en",
            created_at=content_doc["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing content: {str(e)}")

@app.get("/api/content", response_model=List[ContentResponse])
async def get_user_content(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    content_list = []
    async for content in db.content.find({"user_id": str(current_user["_id"])}):
        content_list.append(ContentResponse(
            id=str(content["_id"]),
            title=content["title"],
            content_type=content["content_type"],
            summary=content["summary"],
            language=content["language"],
            created_at=content["created_at"]
        ))
    
    return content_list

@app.get("/api/content/{content_id}", response_model=ContentDetailResponse)
async def get_content_detail(content_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    content = await db.content.find_one({
        "_id": content_id,
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    return ContentDetailResponse(
        id=str(content["_id"]),
        title=content["title"],
        content_type=content["content_type"],
        summary=content["summary"],
        transcript=content["transcript"],
        language=content["language"],
        created_at=content["created_at"]
    )

@app.post("/api/content/{content_id}/translate")
async def translate_content(
    content_id: str,
    translation_request: TranslationRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    content = await db.content.find_one({
        "_id": content_id,
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    try:
        translated_summary = await translation_service.translate_text(
            content["summary"],
            translation_request.target_language
        )
        
        return {"translated_summary": translated_summary}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

# Quiz endpoints
@app.post("/api/quiz/generate/{content_id}", response_model=QuizResponse)
async def generate_quiz(
    content_id: str,
    quiz_request: QuizRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    content = await db.content.find_one({
        "_id": content_id,
        "user_id": str(current_user["_id"])
    })
    
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    try:
        quiz_data = await quiz_service.generate_quiz(
            content["transcript"],
            quiz_request.num_questions,
            quiz_request.difficulty
        )
        
        # Store quiz in database
        quiz_doc = {
            "content_id": content_id,
            "user_id": str(current_user["_id"]),
            "questions": quiz_data["questions"],
            "created_at": datetime.utcnow()
        }
        
        result = await db.quizzes.insert_one(quiz_doc)
        
        return QuizResponse(
            id=str(result.inserted_id),
            content_id=content_id,
            questions=quiz_data["questions"],
            created_at=quiz_doc["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@app.post("/api/quiz/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    quiz = await db.quizzes.find_one({
        "_id": quiz_id,
        "user_id": str(current_user["_id"])
    })
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Calculate score
    correct_answers = 0
    total_questions = len(quiz["questions"])
    
    for i, answer in enumerate(submission.answers):
        if i < len(quiz["questions"]):
            correct_option = quiz["questions"][i]["correct_answer"]
            if answer == correct_option:
                correct_answers += 1
    
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    # Store submission
    submission_doc = {
        "quiz_id": quiz_id,
        "user_id": str(current_user["_id"]),
        "answers": submission.answers,
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "submitted_at": datetime.utcnow()
    }
    
    await db.quiz_submissions.insert_one(submission_doc)
    
    return {
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions
    }

# Q&A endpoints
@app.post("/api/qa/ask")
async def ask_question(
    question_request: QuestionRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        answer = await vector_service.query(
            question_request.question,
            str(current_user["_id"])
        )
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")

# Analytics endpoints
@app.get("/api/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Get content statistics
    content_count = await db.content.count_documents({"user_id": str(current_user["_id"])})
    
    # Get quiz statistics
    quiz_count = await db.quizzes.count_documents({"user_id": str(current_user["_id"])})
    
    # Get average quiz score
    submissions = []
    async for submission in db.quiz_submissions.find({"user_id": str(current_user["_id"])}):
        submissions.append(submission)
    
    avg_score = 0
    if submissions:
        avg_score = sum(s["score"] for s in submissions) / len(submissions)
    
    return {
        "content_count": content_count,
        "quiz_count": quiz_count,
        "quiz_submissions": len(submissions),
        "average_score": round(avg_score, 2)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
