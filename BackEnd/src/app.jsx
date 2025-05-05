import axios from 'axios';
import { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    // Clear previous responses and errors
    setResponse(null);
    setError(null);
    
    // Validate input
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Sending request with prompt:', prompt);
      const res = await axios.post('/ai/get-review', { prompt: prompt.trim() });
      console.log('Response received:', res.data);
      setResponse(res.data);
    } catch (error) {
      console.error('Error details:', error.response || error);
      setError(error.response?.data || error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>AI Review Generator</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea 
          value={prompt} 
          onChange={(e) => setPrompt(e.target.value)} 
          placeholder="Enter prompt for review" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            minHeight: '100px',
            marginBottom: '10px'
          }}
        />
        
        <button 
          onClick={handleSubmit} 
          disabled={loading || !prompt.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Submit'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Response:</h3>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto' 
          }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;