# Sahayak AI - Educational Assistant

An intelligent educational assistant that creates NCERT-based educational content with cultural personalization for Indian students.

## Features

### 🎯 **Content Generation**
- **Quiz Creator**: Generates multiple-choice quizzes with automatic answer keys
- **Worksheet Generator**: Creates practice worksheets with detailed solutions
- **Lesson Plan Builder**: Develops structured lesson plans following NEP 2020 guidelines
- **Educational Stories**: Crafts culturally relevant stories to explain complex concepts

### 🖼️ **Visual & Media Content**
- **Image Generation**: Creates educational diagrams and illustrations using Vertex AI Imagen
- **Video Generation**: Produces educational videos using Google's Veo 3.0 model
- **Simple Diagrams**: Generates line drawings and flowcharts for concept visualization

### 🔍 **Content Search & Retrieval**
- **NCERT Integration**: Searches through Grade 6 Math, Science, and Social Science textbooks
- **Dual Search System**: Combines Vertex AI Search (NCERT content) + Google Search (general knowledge)
- **Context-Aware Responses**: Provides relevant information based on curriculum requirements

### 🎨 **Cultural Personalization**
- **Location-Based Adaptation**: Tailors content using local examples, festivals, and traditions
- **Multi-Language Support**: Generates content in multiple Indian languages
- **Regional Context**: Incorporates geographical and cultural references from user's location

### ⚡ **Structured Output Generation**
- **JSON Schema Validation**: Uses Pydantic models for consistent data structure
- **Gemini Structured Output**: Leverages Google's Gemini API with response schemas
- **Automatic Format Conversion**: Converts structured data to professional DOCX documents

### 📁 **Document Management**
- **Cloud Storage Integration**: Automatically uploads generated documents to Google Cloud Storage
- **Public Access Links**: Provides shareable download URLs for all generated content
- **Multiple Formats**: Supports DOCX for documents, PNG for images, MP4 for videos

### 🔄 **Session Management**
- **Persistent Conversations**: Maintains context across multiple interactions
- **User-Specific Sessions**: Tracks individual user preferences and history
- **Streaming Responses**: Real-time content generation with live updates

### 🛡️ **Safety & Quality**
- **Content Moderation**: Built-in safety filters for educational appropriateness
- **Citation Cleaning**: Removes unwanted citation markers and formatting artifacts
- **Error Handling**: Graceful fallbacks when tools or APIs fail

### 🌐 **API Integration**
- **RESTful API**: HTTP endpoints for creating sessions and streaming queries
- **Firebase Authentication**: Secure user authentication with JWT tokens
- **Cloud Functions**: Serverless deployment for scalable access

### 📚 **Educational Standards**
- **NCERT Curriculum Aligned**: Content strictly follows official Indian curriculum
- **Grade-Appropriate Language**: Adjusts complexity based on student grade level
- **NEP 2020 Compliance**: Lesson plans follow National Education Policy guidelines

## Quick Start

### Installation
```bash
pip install google-cloud-aiplatform[agent_engines,adk]>=1.88
pip install vertexai>=1.38.0 python-docx python-dotenv
```

### Configuration
```env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_DATASTORE_ID=your-ncert-datastore-id
GOOGLE_CLOUD_BUCKET_ID=sahayak-user-documents
```

### Usage Examples

**Generate a Quiz:**
```
"Create a 10-question quiz on photosynthesis for grade 6 science"
→ Returns: DOCX file with multiple-choice questions and answer key
```

**Create a Worksheet:**
```
"Generate a worksheet on fractions with step-by-step solutions"
→ Returns: DOCX file with practice problems and detailed explanations
```

**Build a Lesson Plan:**
```
"Create a lesson plan for teaching the solar system to grade 6 students"
→ Returns: Structured lesson plan following NEP 2020 guidelines
```

**Generate Educational Content:**
```
"Explain the water cycle through a story set in Mumbai"
→ Returns: Culturally relevant story incorporating local context
```

**Create Visual Content:**
```
"Generate a diagram showing parts of a plant"
→ Returns: Educational illustration with labeled components
```

## API Endpoints

### Create Session
```http
POST /create_session
Content-Type: application/json

{
  "user_id": "student_123"
}
```

### Stream Educational Content
```http
POST /stream_query
Content-Type: application/json

{
  "user_id": "student_123",
  "session_id": "session_xyz",
  "message": "Create a quiz on atoms and molecules",
  "location": "Delhi, India",
  "language": "en"
}
```

## Technical Architecture

- **Agent Framework**: Google ADK (Agent Development Kit)
- **LLM Models**: Gemini 2.0 Flash, Gemini 2.5 Pro
- **Search**: Vertex AI Search + Google Search API
- **Media Generation**: Imagen 4.0, Veo 3.0
- **Storage**: Google Cloud Storage
- **Deployment**: Google Cloud Functions
- **Authentication**: Firebase Auth with JWT tokens

---

**Sahayak AI** - Empowering Indian education with AI-powered, culturally relevant content generation.
