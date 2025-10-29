import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

export async function summarizeText(text) {
  try {
    if (!text || text.trim().length === 0) {
      return { summary: 'No comments provided', sentences: [] };
    }

    if (!process.env.AZURE_LANGUAGE_ENDPOINT || !process.env.AZURE_LANGUAGE_KEY) {
      console.log('⚠️ Azure credentials missing, using fallback');
      return fallbackSummarization(text);
    }

    console.log('🤖 Calling Azure Text Analytics...');

    const result = await callAzureSummarization(text);
    
    if (result.sentences && result.sentences.length > 0) {
      console.log('✅ Azure AI summarization successful');
      return result;
    }

    return fallbackSummarization(text);
  } catch (error) {
    console.error('❌ Azure AI failed:', error.message);
    return fallbackSummarization(text);
  }
}

async function callAzureSummarization(text) {
  return new Promise((resolve, reject) => {
    const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT.replace(/\/$/, '');
    const apiKey = process.env.AZURE_LANGUAGE_KEY;
    
    const requestBody = JSON.stringify({
      displayName: 'Staff Review Summarization',
      analysisInput: {
        documents: [
          {
            id: '1',
            language: 'en',
            text: text
          }
        ]
      },
      tasks: [
        {
          kind: 'ExtractiveSummarization',
          taskName: 'Extractive Summarization Task',
          parameters: {
            sentenceCount: 3,
            sortBy: 'Rank'
          }
        }
      ]
    });

    const url = new URL(`${endpoint}/language/analyze-text/jobs?api-version=2023-04-01`);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    // Submit job
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 202) {
          const operationLocation = res.headers['operation-location'];
          if (operationLocation) {
            pollForResults(operationLocation, apiKey, resolve, reject);
          } else {
            reject(new Error('No operation-location header'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

function pollForResults(operationUrl, apiKey, resolve, reject, attempts = 0) {
  if (attempts > 30) {
    reject(new Error('Polling timeout'));
    return;
  }

  setTimeout(() => {
    const url = new URL(operationUrl);
    const options = {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    };

    https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.status === 'succeeded') {
            const task = result.tasks?.items?.[0];
            const doc = task?.results?.documents?.[0];
            
            if (doc?.sentences) {
              const summaryText = doc.sentences.map(s => s.text).join(' ');
              resolve({
                summary: summaryText,
                sentences: doc.sentences.map(s => ({
                  text: s.text,
                  rank: s.rankScore
                }))
              });
            } else {
              reject(new Error('No sentences in response'));
            }
          } else if (result.status === 'failed') {
            reject(new Error('Azure job failed'));
          } else {
            // Still running, poll again
            pollForResults(operationUrl, apiKey, resolve, reject, attempts + 1);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).end();
  }, 1000);
}

function fallbackSummarization(text) {
  console.log('📝 Using fallback summarization');

  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const topSentences = sentences.slice(0, 3);
  const summary = topSentences.join('. ') + (topSentences.length > 0 ? '.' : '');

  return {
    summary: summary || text.substring(0, 200) + '...',
    sentences: topSentences.map((text, i) => ({ text, rank: 1 - (i * 0.1) }))
  };
}
