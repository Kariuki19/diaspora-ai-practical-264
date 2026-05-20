require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_url_here' && supabaseKey !== 'your_supabase_anon_key_here') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('Warning: Supabase credentials are not configured or are using placeholder values. Client not initialized.');
}

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('Gemini AI client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err.message);
  }
} else {
  console.warn('Warning: Gemini API Key is not configured or is using placeholder value. Client not initialized.');
}

// Simple health check route
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

// POST route at /api/tasks
app.post('/api/tasks', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'The "message" string field is required in the request body.'
      });
    }

    if (!genAI) {
      throw new Error('Gemini AI client is not initialized. Please verify your GEMINI_API_KEY environment variable.');
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please verify your SUPABASE_URL and SUPABASE_KEY environment variables.');
    }

    console.log(`Processing message with Gemini AI: "${message}"`);

    // Initialize Gemini model with system instruction and JSON output configuration
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are a task-processing assistant. Output ONLY valid JSON containing: "intent" (strictly one of: send_money, get_airport_transfer, hire_service, verify_document, check_status), "entities" (extracted details as key-value pairs), "generated_steps" (array of 3 action steps), "msg_whatsapp" (string), "msg_email" (string), and "msg_sms" (string).',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    // Generate content
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    console.log('Received raw response from Gemini:', responseText);

    // Parse Gemini JSON output
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`Failed to parse JSON response from Gemini AI: ${parseErr.message}. Raw text: ${responseText}`);
    }

    const intent = parsedData.intent;
    
    // Assign custom risk score based on the intent
    let riskScore = 10;
    if (intent === 'send_money') {
      riskScore = 85;
    } else if (intent === 'verify_document') {
      riskScore = 60;
    } else if (intent === 'get_airport_transfer') {
      riskScore = 30;
    }

    console.log(`Computed risk score: ${riskScore} for intent: "${intent}"`);

    // Insert task into Supabase table mapping exactly to the database columns
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          raw_input: message,
          intent: intent || 'unknown',
          entities: parsedData.entities || {},
          generated_steps: parsedData.generated_steps || [],
          msg_whatsapp: parsedData.msg_whatsapp || '',
          msg_email: parsedData.msg_email || '',
          msg_sms: parsedData.msg_sms || '',
          risk_score: riskScore
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Database insertion succeeded but did not return the saved record.');
    }

    console.log('Task successfully saved to Supabase:', data[0]);

    // Return the fully saved database object back to the client as JSON with a 201 status code
    return res.status(201).json(data[0]);

  } catch (error) {
    console.error('Error in /api/tasks:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server is running in active mode on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`👉 POST tasks API: http://localhost:${PORT}/api/tasks`);
  console.log(`====================================================`);
});
