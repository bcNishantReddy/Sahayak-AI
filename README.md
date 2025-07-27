# Sahayak Agent - Educational Assistant

An intelligent educational assistant built with Google's ADK (Agent Development Kit) that provides culturally relevant learning experiences through story-based explanations and practice worksheets.

## Features

### 1. Story-Based Explanations
- **Cultural Relevance**: Stories are personalized based on user's location and language
- **Educational Content**: Integrates NCERT textbook content seamlessly into narratives
- **Local Context**: Uses Google Search to incorporate local festivals, traditions, and cultural references
- **Multi-language Support**: Can generate stories in user's preferred language

### 2. Worksheet Generator
- **NCERT-Based Content**: Sources questions from official NCERT textbooks using Vertex AI Search
- **Structured Output**: Generates questions in standardized JSON format
- **DOCX Creation**: Converts JSON to professionally formatted Word documents
- **Cloud Storage**: Automatically uploads worksheets to Google Cloud Storage
- **Public Access**: Returns shareable download links

## Architecture

```
┌─────────────────┐
│   Root Agent    │  (Orchestrates between specialized agents)
│   (Sahayak)     │
└─────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Story  │ │Worksheet│
│Agent  │ │ Agent   │
└───────┘ └─────────┘
    │         │
    │    ┌────▼─────┐
    │    │Worksheet │
    │    │Generator │
    │    └────┬─────┘
    │         │
┌───▼────┐ ┌──▼─────┐
│Vertex  │ │Google  │
│AI      │ │Cloud   │
│Search  │ │Storage │
└────────┘ └────────┘
```

## Project Structure

```
gcp-hackathon/
├── sahayak_agent/
│   ├── __init__.py
│   ├── agent.py          # Main agent definitions
│   ├── utils.py          # Utility functions for DOCX and cloud storage
│   └── config.py         # Configuration settings
├── textbooks/            # NCERT textbook PDFs
│   └── grade_6/
│       ├── maths/
│       ├── science/
│       └── social_science/
├── main.py               # Demo and usage examples
├── requirements.txt      # Original dependencies
├── additional_requirements.txt  # New dependencies needed
└── README.md            # This file
```

## Setup Instructions

### 1. Install Dependencies

First, install the additional required packages:

```bash
# In your virtual environment
pip install python-docx google-cloud-storage
```

### 2. Google Cloud Configuration

1. **Set up Google Cloud Storage**:
   ```bash
   # Create a bucket for worksheets
   gsutil mb gs://sahayak-worksheets
   
   # Make bucket publicly readable (optional)
   gsutil iam ch allUsers:objectViewer gs://sahayak-worksheets
   ```

2. **Configure Authentication**:
   ```bash
   # Set up application default credentials
   gcloud auth application-default login
   
   # Or set the environment variable
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
   ```

3. **Vertex AI Search Setup**:
   - Ensure your Vertex AI Search datastore is properly configured
   - Update the `DATASTORE_ID` in `config.py` if needed

### 3. Configuration

Update the configuration in `sahayak_agent/config.py`:

```python
# Update these values for your project
PROJECT_ID = "your-project-id"
BUCKET_NAME = "your-bucket-name"
DATASTORE_ID = "your-datastore-id"
```

## Usage

### Basic Usage

```python
from sahayak_agent.agent import root_agent, story_agent, worksheet_agent

# For story generation
story_response = story_agent.run(
    "Tell me a story about the solar system. I'm from Mumbai and prefer Hindi and English."
)

# For worksheet generation  
worksheet_response = worksheet_agent.run(
    "Create a worksheet on fractions for grade 6 math."
)
```

### Story Agent Usage

The story agent requires:
- **Topic/Theme**: What educational concept to explain
- **Location**: User's city/country for cultural context
- **Language**: Preferred language for the story

**Example Interaction**:
```
User: "Explain photosynthesis through a story"
Agent: "To create a culturally relevant story, please provide your location (city/country) and preferred language."
User: "I'm from Bangalore, India. Please use English with some Kannada words."
Agent: [Generates story incorporating Bangalore's gardens, local festivals, and Kannada cultural elements]
```

### Worksheet Agent Usage

The worksheet agent requires:
- **Subject**: math, science, social_science, etc.
- **Topic**: Specific chapter or concept
- **Grade** (optional): Default is grade 6

**Example Interaction**:
```
User: "I need a worksheet on fractions"
Agent: "Please provide the subject and specific topic for the worksheet."
User: "Math, Chapter 7 - Fractions, Grade 6"
Agent: [Searches NCERT content, generates JSON, creates DOCX, uploads to cloud]
       "Worksheet created successfully! Download link: https://storage.googleapis.com/sahayak-worksheets/worksheets/worksheet_20250723_143052.docx"
```

## JSON Format for Worksheets

The system uses a standardized JSON format:

```json
{
  "Worksheet title": "Fractions - Chapter 7",
  "Worksheet subtitle": "Understanding Fractions and Their Operations", 
  "Questions": [
    {
      "Question": "What is 3/4 + 1/4?",
      "Option 1": "4/4",
      "Option 2": "1", 
      "Option 3": "4/8",
      "Option 4": "Both A and B",
      "Correct Answer": "Option 4"
    }
  ]
}
```

## API Reference

### WorksheetGenerator Class

```python
class WorksheetGenerator:
    def __init__(self, project_id: str, bucket_name: str)
    def create_docx_from_json(self, worksheet_data: Dict[str, Any]) -> str
    def upload_to_cloud_storage(self, local_file_path: str) -> str
```

### Utility Functions

```python
def generate_worksheet_tool(topic: str, subject: str = None, grade: str = "6") -> str
def process_worksheet_json(worksheet_json: str, project_id: str, bucket_name: str) -> str
def format_cultural_story_prompt(topic: str, location: str, language: str) -> str
```

## Best Practices

### For Story Generation:
1. Always provide specific location for better cultural relevance
2. Specify language preferences clearly
3. Include grade level or age group when possible
4. Ask for specific educational topics from NCERT curriculum

### For Worksheet Generation:
1. Be specific about the subject and topic
2. Mention the grade level for appropriate difficulty
3. Allow time for cloud upload completion
4. Check that download links are accessible

### For Development:
1. Use the configuration system for environment-specific settings
2. Handle errors gracefully, especially for cloud operations
3. Implement proper logging for debugging
4. Test with various topics and cultural contexts

## Troubleshooting

### Common Issues:

1. **Import Errors**:
   ```bash
   pip install python-docx google-cloud-storage
   ```

2. **Authentication Errors**:
   ```bash
   gcloud auth application-default login
   ```

3. **Bucket Access Errors**:
   - Ensure bucket exists and is accessible
   - Check IAM permissions for storage operations

4. **Vertex AI Search Errors**:
   - Verify datastore ID is correct
   - Ensure proper API permissions

## Contributing

1. Follow the existing code structure
2. Add comprehensive docstrings
3. Test with various cultural contexts
4. Update configuration as needed
5. Maintain backward compatibility

## License

This project is part of a GCP Hackathon submission.

---

For questions or issues, please refer to the configuration validation in `config.py` or check the demo examples in `main.py`.
