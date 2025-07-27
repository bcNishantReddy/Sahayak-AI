import os
import dotenv
dotenv.load_dotenv()
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
import os


class ContentType(str, Enum):
    """Enum for content types"""
    QUIZ = "quiz"
    WORKSHEET = "worksheet"
    LESSON_PLAN = "lesson_plan"

# Pydantic Models for Structured Output
class QuizOption(BaseModel):
    text: str = Field(description="The option text")

class QuizQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="List of answer options")
    correct_answers: List[int] = Field(description="List of correct answer indices (0-based)")

class QuizData(BaseModel):
    quiz_title: str = Field(description="Title of the quiz")
    quiz_subtitle: str = Field(description="Subtitle or description of the quiz")
    questions: List[QuizQuestion] = Field(description="List of quiz questions")

class WorksheetQuestion(BaseModel):
    question: str = Field(description="The question text")
    answer: str = Field(description="The detailed answer")

class WorksheetData(BaseModel):
    worksheet_title: str = Field(description="Title of the worksheet")
    worksheet_subtitle: str = Field(description="Subtitle or description of the worksheet")
    questions: List[WorksheetQuestion] = Field(description="List of worksheet questions")

class LessonDetail(BaseModel):
    lesson_content: str = Field(description="The lesson content")
    duration: str = Field(description="Duration of the lesson")

class Lesson(BaseModel):
    lesson_title: str = Field(description="Title of the lesson")
    lesson_details: List[LessonDetail] = Field(description="List of lesson details")

class LessonPlanData(BaseModel):
    lesson_plan_title: str = Field(description="Title of the lesson plan")
    lesson_plan_description: str = Field(description="Description of the lesson plan")
    lessons: List[Lesson] = Field(description="List of lessons")

class StructuredEducationalContent(BaseModel):
    content_type: Optional[ContentType] = Field(None, description="Type of content: 'quiz', 'worksheet', or 'lesson_plan'")
    quiz_data: Optional[QuizData] = Field(None, description="Quiz data if content_type is 'quiz'")
    worksheet_data: Optional[WorksheetData] = Field(None, description="Worksheet data if content_type is 'worksheet'")
    lesson_plan_data: Optional[LessonPlanData] = Field(None, description="Lesson plan data if content_type is 'lesson_plan'")
    