const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Enable CORS for all origins
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Function to analyze code with Gemini
async function analyzeCodeWithGemini(codeSnippet) {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prompt for code review and correction
    const prompt = `
    You are a code review assistant. Review the following code snippet and:
    1. Identify all syntax errors, logical issues, and potential bugs
    2. Provide a corrected version of the code
    3. Explain what changes were made and why

    CODE TO REVIEW:
    \`\`\`
    ${codeSnippet}
    \`\`\`

    Format your response as a JSON object with the following structure:
    {
      "analysis": "Brief analysis of the code issues",
      "correctedCode": "The full corrected code",
      "explanations": ["List of explanations for each correction made"]
    }
    
    Only respond with the JSON object, nothing else.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();
    
    // Parse the JSON response
    try {
      // Extract JSON if it's embedded in text
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : textResponse;
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      // If parsing fails, return a structured error
      return {
        analysis: "Failed to parse Gemini response",
        correctedCode: codeSnippet,
        explanations: ["The AI response could not be properly parsed. Please try again with a different code snippet."]
      };
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw new Error('Failed to analyze code with Gemini API');
  }
}

// AI Code Review endpoint
app.post('/ai/get-review', async (req, res) => {
  console.log('Request body:', req.body);
  const { prompt } = req.body;
  
  if (!prompt || prompt.trim() === '') {
    console.log('Error: Empty prompt received');
    return res.status(400).json({ error: "Code snippet is required" });
  }

  try {
    // Call Gemini API to analyze the code
    const analysis = await analyzeCodeWithGemini(prompt);
    
    // Send the response
    const response = {
      success: true,
      prompt: prompt,
      review: analysis.analysis,
      correctedCode: analysis.correctedCode,
      explanations: analysis.explanations,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error processing code review:', error);
    res.status(500).json({ 
      error: "Failed to process code review", 
      message: error.message 
    });
  }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geminiApiConfigured: !!API_KEY,
    timestamp: new Date().toISOString() 
  });
});

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all route for debugging
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.path} not found`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  if (!API_KEY) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: GEMINI_API_KEY not found in environment variables. The code review functionality will not work properly.');
    console.log('Please create a .env file with your Gemini API key: GEMINI_API_KEY=your_api_key_here');
  }
  
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Open your browser to http://localhost:${PORT} to use the application`);
});