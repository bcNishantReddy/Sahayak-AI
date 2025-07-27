import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
from google.cloud import storage
import re
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

load_dotenv()
BUCKET_ID = 'sahayak-user-documents'

def clean_text(text: str) -> str:
    """Remove citation markers and other unwanted formatting from text.
    
    Args:
        text (str): The text to clean
        
    Returns:
        str: Cleaned text without citation markers
    """
    if not text:
        return text
    
    # Remove citation patterns like [16, 17], [14, 19], [1], etc.
    cleaned = re.sub(r'\[\s*\d+(?:\s*,\s*\d+)*\s*\]', '', text)
    
    # Remove any remaining bracket patterns that might be citations
    cleaned = re.sub(r'\[\s*[^\]]*\s*\]', '', cleaned)
    
    # Clean up multiple spaces and strip
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned

def add_text_with_newlines(paragraph, text):
    """Add text to a paragraph, converting \\n to actual line breaks."""
    if not text:
        return
    
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if i > 0:
            paragraph.add_run().add_break()
        paragraph.add_run(line)

def store_file(filepath: str, user_id: str) -> str:
    """Upload any file to Google Cloud Storage.

    Args:
        filepath (str): The file path of the file to upload.
        user_id (str): The ID of the Google Cloud Storage bucket.

    Returns:
        str: The public URL of the uploaded file.
    """
    try:
        global BUCKET_ID
        if not BUCKET_ID:
            raise ValueError("Google Cloud Storage bucket ID is not set in environment variables.")
        client = storage.Client()
        bucket = client.bucket(BUCKET_ID)

        filename = str(filepath).replace(" ", "_").replace(":", "_").replace("'", "_")
        if filename.endswith('.png'):
            blob_path = f"images/{user_id}/{filename}"
        elif filename.endswith('.docx') and "lesson_plan_" in filename:
            blob_path = f"lesson_plans/{user_id}/{filename}"
        elif filename.endswith('.docx') and "worksheet_" in filename:
            blob_path = f"worksheets/{user_id}/{filename}"
        elif filename.endswith('.docx') and "quiz_" in filename:
            blob_path = f"quizzes/{user_id}/{filename}"
        else:
            blob_path = f"files/{user_id}/{filename}"

        blob = bucket.blob(blob_path)
        blob.upload_from_filename(filepath)
        
        os.remove(filepath)
    except Exception as e:
        return f"Error uploading file onto cloud: {e}"

    return blob.public_url
