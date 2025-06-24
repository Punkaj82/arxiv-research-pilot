const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const http = require('http');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname)));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use('/cache', express.static(path.join(__dirname, 'cache')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/icons', express.static(path.join(__dirname, 'icons')));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Create directories if they don't exist
const audioDir = path.join(__dirname, 'audio');
const cacheDir = path.join(__dirname, 'cache', 'papers');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  arxivApiUrl: 'http://export.arxiv.org/api/query',
  maxResults: 10,
  userAgent: 'ArXiv-Fetcher/1.0 (https://github.com/your-repo; your-email@example.com)'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Fetch with timeout
function fetchWithTimeout(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
  });
}

// Parse arXiv XML response
function parseArxivResponse(xmlData) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const entries = result.feed.entry || [];
        const papers = entries.map(entry => {
          const authors = entry.author ? entry.author.map(author => author.name[0]).join(', ') : 'Unknown';
          const summary = entry.summary ? entry.summary[0].replace(/\s+/g, ' ').trim() : '';
          const published = entry.published ? entry.published[0] : '';
          const category = entry.category ? entry.category[0].$.term : '';
          const id = entry.id ? entry.id[0] : '';
          
          return {
            title: entry.title[0].replace(/\s+/g, ' ').trim(),
            authors: authors,
            summary: summary,
            published: published,
            category: category,
            pdfUrl: id.replace('http://arxiv.org/abs/', 'http://arxiv.org/pdf/') + '.pdf',
            id: id
          };
        });

        resolve(papers);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Clean text
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// Split text into sections
function splitIntoSections(text) {
  if (!text) return [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  return paragraphs.map((p, i) => ({
    title: `Section ${i + 1}`,
    content: p.trim()
  }));
}

// ============================================================================
// CONTENT EXTRACTION FUNCTIONS
// ============================================================================

// Extract sections from PDF with timeout
async function extractSectionsFromPDF(pdfBuffer) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('PDF parsing timeout - falling back to text extraction');
      resolve(null);
    }, 8000);
    
    try {
      pdfParse(pdfBuffer)
        .then(data => {
          clearTimeout(timeout);
          const fullText = data.text;
          console.log(`PDF extracted: ${fullText.length} characters`);
          
          // Simple section detection
          const sectionMatches = fullText.match(/(\d+\.\s*[A-Z][^.]*\.?)/g);
          if (sectionMatches && sectionMatches.length > 1) {
            const sections = [];
            sectionMatches.forEach((match, index) => {
              const sectionTitle = match.trim();
              const nextMatch = sectionMatches[index + 1];
              const startIndex = fullText.indexOf(match);
              const endIndex = nextMatch ? fullText.indexOf(nextMatch) : fullText.length;
              const sectionContent = fullText.substring(startIndex + match.length, endIndex).trim();
              
              if (sectionContent.length > 50) {
                sections.push({
                  title: sectionTitle,
                  content: sectionContent
                });
              }
            });
            resolve(sections.length > 0 ? sections : null);
          } else {
            // Single section - split by paragraphs
            const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
            if (paragraphs.length > 0) {
              resolve([{
                title: 'Full Content',
                content: paragraphs.join('\n\n')
              }]);
            } else {
              resolve(null);
            }
          }
        })
        .catch(error => {
          clearTimeout(timeout);
          console.log('PDF parsing error:', error.message);
          resolve(null);
        });
        
    } catch (error) {
      clearTimeout(timeout);
      console.log('PDF parsing failed:', error.message);
      resolve(null);
    }
  });
}

// Extract text from HTML
function extractTextFromHTML(html) {
  try {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags but keep line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();
    
    return text;
  } catch (error) {
    console.log('HTML text extraction failed:', error.message);
    return '';
  }
}

// Create better sections from text
function createBetterSections(text) {
  try {
    const patterns = [
      // Numbered sections: 1. Introduction, 2. Related Work, etc.
      /(\d+\.\s*[A-Z][^.]*\.?)/g,
      // Roman numeral sections: I. Introduction, II. Related Work, etc.
      /([IVX]+\.\s*[A-Z][^.]*\.?)/g,
      // Abstract, Introduction, etc.
      /(Abstract|Introduction|Related Work|Method|Experiments|Results|Conclusion|References)/gi
    ];
    
    let bestSections = [];
    
    for (const pattern of patterns) {
      const matches = [];
      let match;
      
      // Use exec instead of matchAll for compatibility
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          title: match[1].trim(),
          start: match.index + match[0].length
        });
      }
      
      if (matches.length > 1) {
        // Create sections from matches
        const currentSections = [];
        for (let i = 0; i < matches.length; i++) {
          const title = matches[i].title;
          const start = matches[i].start;
          const end = i + 1 < matches.length ? matches[i + 1].start : text.length;
          const content = text.slice(start, end).trim();
          
          if (content.length > 100) {
            currentSections.push({
              title: title,
              content: content
            });
          }
        }
        
        if (currentSections.length > bestSections.length) {
          bestSections = currentSections;
        }
      }
    }
    
    if (bestSections.length > 0) {
      return bestSections;
    } else {
      // Fallback: split by paragraphs
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
      if (paragraphs.length > 0) {
        return [{
          title: 'Full Content',
          content: paragraphs.join('\n\n')
        }];
      }
    }
    
    return [];
  } catch (error) {
    console.log('Section creation failed:', error.message);
    return [];
  }
}

// Enhanced content extraction
async function extractContentFromUrl(url) {
  return new Promise(async (resolve) => {
    try {
      // Try HTML first (more reliable), then PDF as backup
      const htmlUrl = url.replace('.pdf', '').replace('/pdf/', '/html/');
      let data = null;
      let sourceType = 'unknown';
      
      // Try HTML first
      try {
        console.log('Trying HTML extraction first:', htmlUrl);
        data = await fetchWithTimeout(htmlUrl, 5000);
        sourceType = 'html';
      } catch (htmlError) {
        console.log('HTML extraction failed, trying PDF:', htmlError.message);
        try {
          data = await fetchWithTimeout(url, 10000);
          sourceType = 'pdf';
        } catch (pdfError) {
          console.log('Both HTML and PDF failed:', pdfError.message);
          resolve(null);
          return;
        }
      }
      
      if (sourceType === 'pdf') {
        // Try PDF parsing first
        try {
          const sections = await extractSectionsFromPDF(data);
          if (sections && sections.length > 0) {
            const fullText = sections.map(s => s.content).join('\n\n');
            resolve({
              type: 'pdf',
              content: fullText,
              sections: sections
            });
            return;
          }
        } catch (pdfError) {
          console.log('PDF parsing failed, trying HTML extraction:', pdfError.message);
        }
        
        // Fallback to HTML extraction
        const textContent = extractTextFromHTML(data.toString('utf8'));
        if (textContent.length > 500 && !textContent.includes('Redirecting') && !textContent.includes('You should be redirected')) {
          const sections = createBetterSections(textContent);
          resolve({
            type: 'html',
            content: textContent,
            sections: sections
          });
        } else {
          resolve(null);
        }
      } else {
        // HTML extraction
        const textContent = extractTextFromHTML(data.toString('utf8'));
        if (textContent.length > 500) {
          const sections = createBetterSections(textContent);
          resolve({
            type: 'html',
            content: textContent,
            sections: sections
          });
        } else {
          resolve(null);
        }
      }
    } catch (error) {
      console.log('Content extraction completely failed:', error.message);
      resolve(null);
    }
  });
}

// Mock audio generation
function generateMockAudio(text, filename) {
  return new Promise((resolve, reject) => {
    try {
      const audioPath = path.join(__dirname, 'audio', filename.replace('.mp3', '.txt'));
      fs.writeFileSync(audioPath, text);
      resolve(`/audio/${filename.replace('.mp3', '.txt')}`);
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================================
// AI RESEARCH ASSISTANT FUNCTIONS
// ============================================================================

// Extract mathematical models from research papers
async function extractMathematicalModels(paperContent) {
  try {
    // Use OpenAI API if available, otherwise use local analysis
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
    
    if (hasOpenAI) {
      const { Configuration, OpenAIApi } = require('openai');
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);
      
      const prompt = `Extract mathematical models, equations, and algorithms from this research paper. 
      Provide them in a structured format with:
      1. Model definitions
      2. Mathematical equations
      3. Algorithm pseudocode
      4. Implementation notes
      
      Research Paper Content:
      ${paperContent.substring(0, 3000)}
      
      Format the response as:
      ## Mathematical Models
      [List of models with equations]
      
      ## Algorithms
      [Algorithm descriptions with pseudocode]
      
      ## Implementation
      [Implementation guidelines]`;
      
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert mathematician and computer scientist specializing in extracting mathematical models from research papers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });
      
      return {
        success: true,
        models: response.data.choices[0].message.content,
        source: 'OpenAI GPT-3.5'
      };
    } else {
      // Local mathematical model extraction
      return extractMathematicalModelsLocal(paperContent);
    }
  } catch (error) {
    console.error('Mathematical model extraction error:', error);
    return extractMathematicalModelsLocal(paperContent);
  }
}

// Local mathematical model extraction
function extractMathematicalModelsLocal(paperContent) {
  const models = [];
  const algorithms = [];
  
  // Extract mathematical expressions
  const mathPatterns = [
    /\\[([^\\]+)\\]/g,  // LaTeX expressions
    /\\\(([^\\]+)\\\)/g, // Inline math
    /\\begin\{equation\}(.*?)\\end\{equation\}/gs, // Equation blocks
    /\\begin\{align\}(.*?)\\end\{align\}/gs, // Align blocks
    /\\begin\{algorithm\}(.*?)\\end\{algorithm\}/gs, // Algorithm blocks
  ];
  
  // Extract algorithms and pseudocode
  const algorithmPatterns = [
    /Algorithm\s+\d+[:\s]*([^.]*)/gi,
    /Function\s+([^(]+)\([^)]*\)/gi,
    /procedure\s+([^(]+)\([^)]*\)/gi,
    /def\s+([^(]+)\([^)]*\)/gi,
  ];
  
  // Find mathematical expressions
  mathPatterns.forEach(pattern => {
    const matches = paperContent.match(pattern);
    if (matches) {
      models.push(...matches);
    }
  });
  
  // Find algorithms
  algorithmPatterns.forEach(pattern => {
    const matches = paperContent.match(pattern);
    if (matches) {
      algorithms.push(...matches);
    }
  });
  
  return {
    success: true,
    models: {
      mathematicalExpressions: models.slice(0, 10),
      algorithms: algorithms.slice(0, 10),
      implementation: generateImplementationGuidelines(paperContent)
    },
    source: 'Local Analysis'
  };
}

// Generate code libraries from research
async function generateCodeLibrary(paperContent, language = 'python') {
  try {
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
    
    if (hasOpenAI) {
      const { Configuration, OpenAIApi } = require('openai');
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);
      
      const prompt = `Generate a complete ${language} library based on this research paper. 
      Include:
      1. Main class/function implementations
      2. Example usage
      3. Documentation
      4. Tests
      5. Requirements
      
      Research Paper Content:
      ${paperContent.substring(0, 3000)}
      
      Create a production-ready library that implements the research concepts.`;
      
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert software engineer specializing in ${language} library development.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.4
      });
      
      return {
        success: true,
        library: response.data.choices[0].message.content,
        source: 'OpenAI GPT-3.5'
      };
    } else {
      return generateCodeLibraryLocal(paperContent, language);
    }
  } catch (error) {
    console.error('Code library generation error:', error);
    return generateCodeLibraryLocal(paperContent, language);
  }
}

// Local code library generation
function generateCodeLibraryLocal(paperContent, language = 'python') {
  const title = extractPaperTitle(paperContent);
  const concepts = extractKeyConcepts(paperContent);
  
  let libraryCode = '';
  
  if (language === 'python') {
    libraryCode = `"""
${title} - Research Implementation Library
Generated from research paper analysis
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import logging

class ResearchImplementation:
    """
    Main implementation class based on research paper: ${title}
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        
    def preprocess_data(self, data: np.ndarray) -> np.ndarray:
        """
        Preprocess data according to research methodology
        """
        # Implementation based on research paper
        processed_data = data.copy()
        # Add preprocessing logic here
        return processed_data
        
    def train_model(self, X: np.ndarray, y: np.ndarray) -> Any:
        """
        Train model based on research algorithm
        """
        # Implementation based on research methodology
        self.logger.info("Training model based on research paper")
        # Add training logic here
        return self
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using trained model
        """
        # Implementation based on research paper
        # Add prediction logic here
        return np.zeros(len(X))
        
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """
        Evaluate model performance
        """
        predictions = self.predict(X)
        # Add evaluation metrics here
        return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0}

# Example usage
if __name__ == "__main__":
    # Example implementation
    model = ResearchImplementation()
    print("Research implementation library ready!")
`;
  }
  
  return {
    success: true,
    library: libraryCode,
    requirements: generateRequirements(concepts),
    documentation: generateDocumentation(title, concepts),
    source: 'Local Generation'
  };
}

// Create tools and applications from research concepts
async function createResearchTools(paperContent) {
  try {
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here';
    
    if (hasOpenAI) {
      const { Configuration, OpenAIApi } = require('openai');
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);
      
      const prompt = `Create practical tools and applications based on this research paper. 
      Include:
      1. Web application concept
      2. Desktop tool design
      3. API service specification
      4. Mobile app concept
      5. Command-line tool
      
      Research Paper Content:
      ${paperContent.substring(0, 3000)}
      
      Provide detailed specifications for each tool.`;
      
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert product manager and software architect specializing in creating practical tools from research.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.6
      });
      
      return {
        success: true,
        tools: response.data.choices[0].message.content,
        source: 'OpenAI GPT-3.5'
      };
    } else {
      return createResearchToolsLocal(paperContent);
    }
  } catch (error) {
    console.error('Research tools creation error:', error);
    return createResearchToolsLocal(paperContent);
  }
}

// Local research tools creation
function createResearchToolsLocal(paperContent) {
  const title = extractPaperTitle(paperContent);
  const concepts = extractKeyConcepts(paperContent);
  const domain = extractResearchDomain(paperContent);
  
  const tools = {
    webApplication: {
      name: `${title} Web Tool`,
      description: `Web-based implementation of ${title} research`,
      features: [
        'Interactive data visualization',
        'Real-time processing',
        'User-friendly interface',
        'Export capabilities'
      ],
      techStack: ['React.js', 'Node.js', 'Python Flask', 'PostgreSQL']
    },
    desktopTool: {
      name: `${title} Desktop App`,
      description: `Desktop application for ${title}`,
      features: [
        'Offline processing',
        'High-performance computing',
        'Local data storage',
        'Batch processing'
      ],
      techStack: ['Electron', 'Python', 'SQLite', 'TensorFlow']
    },
    apiService: {
      name: `${title} API`,
      description: `RESTful API service for ${title}`,
      features: [
        'Scalable microservice',
        'JSON API endpoints',
        'Authentication',
        'Rate limiting'
      ],
      techStack: ['FastAPI', 'Docker', 'Redis', 'MongoDB']
    },
    mobileApp: {
      name: `${title} Mobile`,
      description: `Mobile app for ${title}`,
      features: [
        'Cross-platform support',
        'Offline capability',
        'Push notifications',
        'Cloud sync'
      ],
      techStack: ['React Native', 'Firebase', 'TensorFlow Lite']
    }
  };
  
  return {
    success: true,
    tools: tools,
    source: 'Local Generation'
  };
}

// Helper functions
function extractPaperTitle(content) {
  const titleMatch = content.match(/Title[:\s]*([^\n]+)/i);
  return titleMatch ? titleMatch[1].trim() : 'Research Paper';
}

function extractKeyConcepts(content) {
  const concepts = [];
  const conceptPatterns = [
    /algorithm/i,
    /model/i,
    /framework/i,
    /methodology/i,
    /approach/i,
    /technique/i
  ];
  
  conceptPatterns.forEach(pattern => {
    if (content.match(pattern)) {
      concepts.push(pattern.source.replace(/[\/i]/g, ''));
    }
  });
  
  return concepts.length > 0 ? concepts : ['research', 'analysis', 'implementation'];
}

function extractResearchDomain(content) {
  if (content.match(/machine learning|ml|ai|artificial intelligence/i)) return 'AI/ML';
  if (content.match(/computer vision|cv|image/i)) return 'Computer Vision';
  if (content.match(/nlp|natural language/i)) return 'NLP';
  if (content.match(/optimization/i)) return 'Optimization';
  return 'General Research';
}

function generateImplementationGuidelines(content) {
  return {
    setup: 'Install required dependencies and configure environment',
    preprocessing: 'Prepare data according to research methodology',
    training: 'Train models using specified algorithms',
    evaluation: 'Evaluate performance using research metrics',
    deployment: 'Deploy implementation for production use'
  };
}

function generateRequirements(concepts) {
  const baseRequirements = ['numpy', 'pandas', 'scikit-learn'];
  const conceptRequirements = {
    'algorithm': ['scipy', 'matplotlib'],
    'model': ['tensorflow', 'pytorch'],
    'framework': ['flask', 'fastapi'],
    'methodology': ['seaborn', 'plotly']
  };
  
  const requirements = [...baseRequirements];
  concepts.forEach(concept => {
    if (conceptRequirements[concept.toLowerCase()]) {
      requirements.push(...conceptRequirements[concept.toLowerCase()]);
    }
  });
  
  return [...new Set(requirements)];
}

function generateDocumentation(title, concepts) {
  return {
    overview: `Implementation of ${title} research paper`,
    installation: 'pip install -r requirements.txt',
    usage: 'Basic usage examples and API documentation',
    examples: 'Code examples demonstrating key features',
    api: 'Complete API reference documentation'
  };
}

// ============================================================================
// AI RESEARCH ASSISTANT API ENDPOINTS
// ============================================================================

// Extract mathematical models endpoint
app.post('/api/extract-models', async (req, res) => {
  try {
    const { paperContent } = req.body;
    
    if (!paperContent) {
      return res.status(400).json({
        success: false,
        error: 'Paper content is required'
      });
    }
    
    console.log('Extracting mathematical models from research paper');
    const result = await extractMathematicalModels(paperContent);
    
    res.json(result);
    
  } catch (error) {
    console.error('Model extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract mathematical models'
    });
  }
});

// Generate code library endpoint
app.post('/api/generate-library', async (req, res) => {
  try {
    const { paperContent, language = 'python' } = req.body;
    
    if (!paperContent) {
      return res.status(400).json({
        success: false,
        error: 'Paper content is required'
      });
    }
    
    console.log(`Generating ${language} library from research paper`);
    const result = await generateCodeLibrary(paperContent, language);
    
    res.json(result);
    
  } catch (error) {
    console.error('Library generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code library'
    });
  }
});

// Create research tools endpoint
app.post('/api/create-tools', async (req, res) => {
  try {
    const { paperContent } = req.body;
    
    if (!paperContent) {
      return res.status(400).json({
        success: false,
        error: 'Paper content is required'
      });
    }
    
    console.log('Creating research tools from paper');
    const result = await createResearchTools(paperContent);
    
    res.json(result);
    
  } catch (error) {
    console.error('Tools creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create research tools'
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Get papers from arXiv
app.get('/api/papers', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    let query = `cat:${category}`;
    
    if (startDate && endDate) {
      const start = startDate.replace(/-/g, '');
      const end = endDate.replace(/-/g, '');
      query += ` AND submittedDate:[${start}000000 TO ${end}235959]`;
    }

    const url = `${config.arxivApiUrl}?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&max_results=${config.maxResults}`;
    
    console.log('ArXiv API Query:', query);
    console.log('Fetching from arXiv:', url);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': config.userAgent
      }
    });

    console.log('arXiv API response status:', response.status);
    console.log('Response data length:', response.data.length);

    const papers = await parseArxivResponse(response.data);
    
    res.json({
      success: true,
      papers: papers,
      query: query,
      count: papers.length
    });

  } catch (error) {
    console.error('Error fetching papers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch papers from arXiv',
      details: error.message
    });
  }
});

// Extract enhanced content
app.post('/api/extract-enhanced', async (req, res) => {
  try {
    const { paper } = req.body;
    
    if (!paper) {
      return res.status(400).json({ success: false, error: 'Paper data is required' });
    }

    let content = null;
    let usedFallback = false;

    // Always try to extract from PDF/HTML if available
    if (paper.pdfUrl) {
      try {
        console.log('Attempting to extract content from PDF:', paper.pdfUrl);
        const extracted = await extractContentFromUrl(paper.pdfUrl);
        if (extracted && extracted.content && extracted.sections && extracted.sections.length > 0) {
          content = {
            fullText: extracted.content,
            sections: extracted.sections,
            wordCount: extracted.content.split(/\s+/).length,
            characterCount: extracted.content.length,
            source: extracted.type
          };
          console.log('PDF/HTML content extracted successfully for classroom mode.');
        } else {
          usedFallback = true;
        }
      } catch (error) {
        console.log('PDF/HTML extraction failed, using fallback:', error.message);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    // Fallback: use summary/abstract if PDF fails
    if (!content && usedFallback) {
      content = {
        fullText: paper.summary,
        sections: splitIntoSections(paper.summary),
        wordCount: paper.summary.split(/\s+/).length,
        characterCount: paper.summary.length,
        source: 'abstract'
      };
      console.log('Fallback: using abstract/summary for classroom mode.');
    }

    res.json({
      success: true,
      content: content
    });

  } catch (error) {
    console.error('Error extracting enhanced content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract enhanced content'
    });
  }
});

// Generate audio
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { paper, type } = req.body;
    
    if (!paper || !type) {
      return res.status(400).json({ success: false, error: 'Paper and type are required' });
    }

    let summary = '';
    let filename = '';
    
    switch (type) {
      case 'podcast':
        summary = `Welcome to our research podcast. Today we're discussing "${paper.title}" by ${paper.authors}. 
                  This paper, published on ${formatDate(paper.published)}, 
                  explores ${paper.category.replace('cs.', 'Computer Science ')}. 
                  Here's what you need to know: ${paper.summary.substring(0, 500)}... 
                  The key findings suggest important implications for the field. 
                  For more details, check out the full paper on arXiv. 
                  Thanks for listening to our research summary.`;
        filename = `paper_podcast_${Date.now()}.txt`;
        break;
        
      case 'classroom':
        // Enhanced classroom mode with full content extraction
        let classroomText = '';
        let sectionCount = 0;
        
        if (paper.sections && Array.isArray(paper.sections) && paper.sections.length > 0) {
          console.log('Using existing sections for classroom mode:', paper.sections.length);
          classroomText = paper.sections.map(
            (section, idx) => `Section ${idx + 1}: ${section.content}`
          ).join('\n\n');
          sectionCount = paper.sections.length;
        } else {
          // Try to get enhanced content
          try {
            console.log('Requesting enhanced content for classroom mode...');
            const enhancedResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/extract-enhanced`, {
              paper: paper
            });
            
            if (enhancedResponse.data.success && enhancedResponse.data.content.sections.length > 0) {
              console.log('Enhanced content received for classroom mode:', enhancedResponse.data.content.sections.length, 'sections');
              classroomText = enhancedResponse.data.content.sections.map(
                (section, idx) => `Section ${section.index || idx + 1}: ${section.title}\n${section.content}`
              ).join('\n\n');
              sectionCount = enhancedResponse.data.content.sections.length;
            } else {
              console.log('Enhanced extraction returned no sections, using abstract');
              classroomText = paper.summary;
              sectionCount = 1;
            }
          } catch (error) {
            console.log('Enhanced extraction failed for classroom mode, using fallback:', error.message);
            classroomText = paper.summary;
            sectionCount = 1;
          }
        }
        
        summary = `Good morning class. Today's lecture covers "${paper.title}" by ${paper.authors}. 
                  This research, published on ${formatDate(paper.published)}, 
                  falls under the category of ${paper.category.replace('cs.', 'Computer Science ')}. 
                  We will cover ${sectionCount} main sections in this lecture.\n\n${classroomText}\n\nAny questions about this paper?`;
        filename = `paper_classroom_${Date.now()}.txt`;
        break;
        
      case 'full':
        summary = `Full paper reading: "${paper.title}" by ${paper.authors}. 
                  Published on ${formatDate(paper.published)}. 
                  Category: ${paper.category.replace('cs.', 'Computer Science ')}. 
                  Abstract: ${paper.summary}. 
                  This concludes the full paper reading.`;
        filename = `paper_full_${Date.now()}.txt`;
        break;
        
      default:
        summary = paper.summary;
        filename = `paper_${type}_${Date.now()}.txt`;
    }

    const audioUrl = await generateMockAudio(summary, filename);
    
    res.json({
      success: true,
      audioUrl: audioUrl,
      filename: filename,
      type: type
    });

  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate audio'
    });
  }
});

// Classroom mode endpoint
app.get('/api/classroom/:id', async (req, res) => {
  try {
    const paperId = req.params.id;
    console.log(`Classroom mode requested for paper: ${paperId}`);
    
    // Get paper details from cache or fetch
    const cacheFile = path.join(__dirname, 'cache', 'papers', `${paperId}.json`);
    let paperData;
    
    if (fs.existsSync(cacheFile)) {
      paperData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } else {
      return res.status(404).json({ error: 'Paper not found in cache' });
    }
    
    // Try to get enhanced content first
    let enhancedContent = null;
    try {
      const pdfUrl = `http://arxiv.org/pdf/${paperId}.pdf`;
      console.log(`Attempting enhanced extraction for classroom mode: ${pdfUrl}`);
      enhancedContent = await extractContentFromUrl(pdfUrl);
    } catch (error) {
      console.log('Enhanced extraction failed for classroom mode:', error.message);
    }
    
    // Use enhanced content if available, otherwise use abstract
    let content = paperData.summary;
    let sections = [];
    
    if (enhancedContent && enhancedContent.sections && enhancedContent.sections.length > 0) {
      console.log(`Using enhanced content with ${enhancedContent.sections.length} sections for classroom mode`);
      content = enhancedContent.content;
      sections = enhancedContent.sections;
    } else {
      console.log('Using abstract/summary for classroom mode (enhanced extraction failed)');
      // Create a single section from abstract
      sections = [{
        title: 'Abstract',
        content: paperData.summary
      }];
    }
    
    // Generate classroom content
    const classroomContent = {
      title: paperData.title,
      authors: paperData.authors,
      abstract: paperData.summary,
      sections: sections,
      fullContent: content,
      paperId: paperId,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Classroom mode ready with ${sections.length} sections`);
    res.json(classroomContent);
    
  } catch (error) {
    console.error('Classroom mode error:', error);
    res.status(500).json({ error: 'Failed to generate classroom content' });
  }
});

// ============================================================================
// STATIC FILE ROUTES
// ============================================================================

app.get('/arxiv-research-pilot.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'arxiv-research-pilot.html'));
});

// PWA Routes
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Serve arxiv-research-pilot.html for all non-API, non-static routes (SPA support)
app.get(/^\/(?!api|audio|icons|screenshots|manifest\.json|sw\.js|favicon\.ico).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'arxiv-research-pilot.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📖 Open this URL in your browser to use the app.`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎙️  Audio features: Demo mode (text files instead of audio)`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
}); 