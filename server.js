/**
 * ============================================================================
 * DIASPORA TASK MANAGER - BACKEND API SERVER
 * ============================================================================
 * 
 * This server acts as the central middleware orchestrator for the Diaspora AI task 
 * management platform. It combines a robust Express.js API framework with high-quality 
 * Generative AI reasoning (Google Gemini 2.5 Flash) and real-time persistence (Supabase).
 * 
 * Core Capabilities:
 *   1. Express API Routing & Middleware parsing.
 *   2. Strict schema-enforced AI text extraction & intent classification.
 *   3. Custom transaction risk-scoring based on security heuristics.
 *   4. Relational database insertion and transactional response mapping.
 */

require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ----------------------------------------------------------------------------
// 1. EXPRESS APP SETTINGS & MIDDLEWARE CONFIGURATION
// ----------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming HTTP request bodies with Content-Type: application/json.
// Without this middleware, req.body would resolve to undefined.
app.use(express.json());

// ----------------------------------------------------------------------------
// 2. SUPABASE DATABASE CLIENT INITIALIZATION
// ----------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
// Validate that active environment credentials are loaded before initializing the client.
if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here' && supabaseKey !== 'your_supabase_anon_key_here') {
  try {
    // Initializes the Supabase client connection which will be utilized for DB persistence.
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('Warning: Supabase credentials are not configured or are using placeholder values. Client not initialized.');
}

// ----------------------------------------------------------------------------
// 3. GEMINI AI CLIENT INITIALIZATION
// ----------------------------------------------------------------------------
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI = null;
// Validate that an active API Key is loaded before initializing the Google Generative AI client.
if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    // Initializes the official Google Gen AI SDK wrapper using the loaded API Key.
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('Gemini AI client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err.message);
  }
} else {
  console.warn('Warning: Gemini API Key is not configured or is using placeholder value. Client not initialized.');
}

// ----------------------------------------------------------------------------
// 4. GET /health - CORE DIAGNOSTIC ENDPOINT
// ----------------------------------------------------------------------------
// Basic health check route allowing load balancers or system diagnostics to verify
// that the Express server is online and checks if external dependencies are connected.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running smoothly',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!supabase,
      gemini: !!genAI
    }
  });
});

// ----------------------------------------------------------------------------
// 5. POST /api/tasks - INTELLIGENT AI ROUTING & PERSISTENCE
// ----------------------------------------------------------------------------
app.post('/api/tasks', async (req, res) => {
  try {
    // --- Step 5.1: Request Body Validation ---
    const { message } = req.body;

    // Validate that a non-empty, string "message" was passed in the request body.
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'The "message" string field is required in the request body.'
      });
    }

    // Fail early if crucial AI or Database adapters are not configured.
    if (!genAI) {
      throw new Error('Gemini AI client is not initialized. Please verify your GEMINI_API_KEY environment variable.');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please verify your SUPABASE_URL and SUPABASE_KEY environment variables.');
    }

    console.log(`Processing message with Gemini AI: "${message}"`);

    // --- Step 5.2: Gemini Model Initialization & Prompt Design ---
    // We instantiate the state-of-the-art gemini-2.5-flash model.
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // The systemInstruction acts as a strict guardrail telling the AI its identity and exact formatting guidelines.
      systemInstruction: 'You are a task-processing assistant. Output ONLY valid JSON containing: "intent" (strictly one of: send_money, get_airport_transfer, hire_service, verify_document, check_status), "entities" (extracted details as key-value pairs), "generated_steps" (array of 3 action steps), "msg_whatsapp" (string), "msg_email" (string), and "msg_sms" (string).',
      // --- Step 5.3: Strict JSON Schema Enforcement ---
      // By setting responseMimeType to 'application/json', we instruct the Gemini model to natively 
      // output ONLY a syntactically valid JSON payload, eliminating potential raw markdown wrapping errors.
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    // --- Step 5.4: Generative Content Execution ---
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    console.log('Received raw response from Gemini:', responseText);

    // --- Step 5.5: Response Parsing & Error Isolation ---
    let parsedData;
    try {
      // Parse the JSON string outputted by Gemini into a native JavaScript object.
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON response from Gemini AI: ${parseErr.message}. Raw text: ${responseText}`);
    }

    const intent = parsedData.intent;
    
    // --- Step 5.6: Custom Risk-Scoring Heuristics ---
    // Different transaction intents carry varying operational and compliance risk.
    // We assign an integer risk score to help audit and review high-risk actions.
    let riskScore = 10; // Default low risk score for normal operations
    if (intent === 'send_money') {
      riskScore = 85;       // High compliance and financial risk
    } else if (intent === 'verify_document') {
      riskScore = 60;       // Medium compliance and data privacy risk
    } else if (intent === 'get_airport_transfer') {
      riskScore = 30;       // Low operational risk
    }

    console.log(`Computed risk score: ${riskScore} for intent: "${intent}"`);

    // --- Step 5.7: Unique Task Code Generation ---
    // A database level unique constraint requires every task to have a tracking ID.
    // We generate a human-readable unique code prefixing random numeric tracking sequences.
    const task_code = 'TSK-' + Math.floor(Math.random() * 1000000);

    console.log(`Generated task code: ${task_code}`);

    // --- Step 5.8: Supabase Database Insertion ---
    // Inserts the structured payload directly into the 'tasks' table.
    // Maps API properties exactly to the database columns schema.
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          task_code,                             // Generated transaction tracker
          raw_input: message,                    // Original user request string
          intent: intent || 'unknown',           // Classified task classification
          entities: parsedData.entities || {},    // Key-value extracted details
          generated_steps: parsedData.generated_steps || [], // Array of action items
          msg_whatsapp: parsedData.msg_whatsapp || '', // WhatsApp tailored communication
          msg_email: parsedData.msg_email || '',       // Email tailored communication
          msg_sms: parsedData.msg_sms || '',           // SMS tailored communication
          risk_score: riskScore                  // Assigned transactional risk score
        }
      ])
      .select(); // Request the database to return the newly generated row back

    // Error handling block specifically checking for Supabase insertion failures.
    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }

    // Validate that the database returned the saved record successfully.
    if (!data || data.length === 0) {
      throw new Error('Database insertion succeeded but did not return the saved record.');
    }

    console.log('Task successfully saved to Supabase:', data[0]);

    // --- Step 5.9: Transaction Response ---
    // Return the newly created database object back to the client as JSON with a 201 Created status.
    return res.status(201).json(data[0]);

  } catch (error) {
    // --- Step 5.10: Centralized Error Diagnostics ---
    // Handles database failures, AI timeouts, or parsing errors gracefully.
    console.error('Error in /api/tasks:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// ----------------------------------------------------------------------------
// 6. SERVER BOOTSTRAP
// ----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server is running in active mode on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`👉 POST tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`====================================================`);
});
