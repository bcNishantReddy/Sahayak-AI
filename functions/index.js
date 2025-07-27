/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onCall } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { ReasoningEngineServiceClient } = require('@google-cloud/aiplatform');
const admin = require('firebase-admin'); // Import Firebase Admin SDK

// Set global options for 2nd gen functions
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  memory: '512MiB',
});

admin.initializeApp(); // Initialize Firebase Admin SDK
const db = admin.firestore();

// Initialize the ReasoningEngineServiceClient outside the function for better performance
const reasoningEngineClient = new ReasoningEngineServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com', // Ensure this matches your region
});

const PROJECT_ID = 'analog-ace-458917-c7';
const LOCATION = 'us-central1';
const REASONING_ENGINE_ID = '4576316928385089536'; // Your deployed Agent Engine ID
const AGENT_ENGINE_PARENT = `projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${REASONING_ENGINE_ID}`;

// Firestore collection to store user sessions
const SESSIONS_COLLECTION = 'userAgentSessions';

exports.interactWithAgent = onCall(async (data, context) => {
    const { userId, userQuery, userLocation, userLanguage, startNewSession = false } = data;

    if (!userId || !userQuery) {
        throw new Error('Missing userId or userQuery.');
    }

    let currentSessionId;
    const sessionDocRef = db.collection(SESSIONS_COLLECTION).doc(userId); // Document per user

    try {
        // 1. Check for an existing session for this user
        const sessionDoc = await sessionDocRef.get();

        if (sessionDoc.exists && sessionDoc.data().activeSessionId && !startNewSession) {
            // Resume existing session
            currentSessionId = sessionDoc.data().activeSessionId;
            console.log(`Resuming session: ${currentSessionId} for user: ${userId}`);
        } else {
            // Create a new session
            console.log(`Creating new session for user: ${userId}`);
            const [newSessionResponse] = await reasoningEngineClient.createSession({
                parent: AGENT_ENGINE_PARENT,
                session: {
                    userId: userId, // This associates the session with your user_id
                    // You can set initial session state here if your agent is designed to use it
                    // e.g., "state": { "initial_context": { "location": userLocation, "language": userLanguage } }
                }
            });
            currentSessionId = newSessionResponse.name; // This is the full resource name like projects/.../sessions/12345
            
            // Store the new session ID in Firestore
            await sessionDocRef.set({ activeSessionId: currentSessionId, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            console.log(`New session created and stored: ${currentSessionId}`);
        }

        // 2. Query the Agent Engine with the session_id and user context
        // The structure of 'query' and 'parameters' depends on your agent's definition.
        // For ADK agents using VertexAiSessionService and VertexAiMemoryBankService,
        // the session_id handles conversation history. Custom inputs are for current turn context.
        const queryRequest = {
            name: AGENT_ENGINE_PARENT, // The Agent Engine resource name
            session: currentSessionId, // The full session resource name
            query: {
                text: {
                    text_content: userQuery,
                },
                // Pass custom context here. The exact field name (e.g., 'custom_attributes', 'parameters')
                // depends on how your Agent Engine's `query` method is implemented.
                // For ADK agents, you'd typically pass these as part of your custom tools' inputs
                // or if your agent's query method explicitly accepts a 'user_context' field.
                custom_attributes: { // Example field, adapt to your agent's schema
                    "location": userLocation || "Unknown",
                    "language": userLanguage || "en"
                }
            }
        };

        const [queryResponse] = await reasoningEngineClient.queryAgent(queryRequest);

        console.log('Agent Engine Response:', JSON.stringify(queryResponse, null, 2));

        // Update session lastUpdated timestamp in Firestore
        await sessionDocRef.update({ lastUpdated: admin.firestore.FieldValue.serverTimestamp() });

        // The exact output structure depends on your agent's response.
        const agentResponseText = queryResponse.response?.text?.text_content || "No textual response.";

        return {
            status: 'success',
            response: agentResponseText,
            sessionId: currentSessionId // Return the session ID to the client if needed
        };

    } catch (error) {
        console.error('Error interacting with Agent Engine:', error);
        // Provide more detailed error messages in development, but generalize in production
        throw new Error(`Failed to interact with the AI agent: ${error.message}`);
    }
});
