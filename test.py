from vertexai import agent_engines
import time

resource_id = '3011316057873842176'
message = "What is the capital of France?"
user_id = 'user_123'

remote_app = agent_engines.get(resource_id)

remote_session = remote_app.create_session(user_id=user_id)

print(f"Sending message to session {remote_session['id']}:")
print(f"Message: {message}")
print("\nResponse:")

event_count = 0
for event in remote_app.stream_query(
    user_id=user_id,
    session_id=remote_session['id'],
    message=message,
):
    event_count += 1
    print(f"\n--- Event {event_count} ---")
    print(event)
    
    # Add a small delay to see events more clearly
    time.sleep(0.1)

print(f"\nTotal events received: {event_count}")
if event_count == 1:
    print("Only received 1 event - this suggests the tool call might be hanging or failing.")
    print("Check if your search_agent tool is properly configured and has access to required APIs.")