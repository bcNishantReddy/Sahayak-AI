import os
import json as JSON
from flask import Flask, request, Response
import vertexai
from vertexai import agent_engines

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = 'us-central1'
AGENT_ID = '2716330282281074688'
if not PROJECT_ID:
    raise ValueError("GOOGLE_CLOUD_PROJECT environment variable is not set.")

app = Flask(__name__)

@app.route("/create_session", methods=["POST"])
def create_session():
    data = request.get_json()
    user_id = data.get("user_id", "test_user_123")

    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        remote_agent = agent_engines.get(
            f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ID}"
        )
        session = remote_agent.create_session(user_id=user_id)
        return JSON.dumps({"session_id": session["id"]}), 200, {"Content-Type": "application/json"}
    except Exception as e:
        return JSON.dumps({"error": str(e)}), 500, {"Content-Type": "application/json"}

@app.route("/stream_query", methods=["POST"])
def stream_query():
    data = request.get_json()
    user_id = data.get("user_id", "test_user_123")
    session_id = data.get("session_id")
    message = data.get("message")

    if not session_id or not message:
        return Response("Missing session_id or message", status=400)

    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        remote_agent = agent_engines.get(
            f"projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ID}"
        )
        def event_stream():
            for event in remote_agent.stream_query(
                user_id=user_id,
                session_id=session_id,
                message= f'Context:\n language: {data.get("language", "en")}\n location: {data.get("location", "unknown")}\n user_id: {user_id}\n\n ' + message,
            ):
                yield f"data: {JSON.dumps(event)}\n\n"
        return Response(event_stream(), mimetype="text/event-stream")
    except Exception as e:
        return Response(f"data: [ERROR] {e}\n\n", mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)