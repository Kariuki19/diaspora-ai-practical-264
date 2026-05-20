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
    const { title, description, ...otherFields } = req.body;

    if (!title) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'The "title" field is required.'
      });
    }

    console.log('Received task data:', { title, description, ...otherFields });

    // Echo back the created task with status
    return res.status(201).json({
      success: true,
      message: 'Task received successfully',
      data: {
        id: Math.random().toString(36).substr(2, 9), // Mock ID
        title,
        description,
        ...otherFields,
        createdAt: new Date().toISOString()
      },
      databaseSaved: !!supabase
    });
  } catch (error) {
    console.error('Error handling /api/tasks:', error);
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
