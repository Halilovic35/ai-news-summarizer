import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // Return "No Content" status if favicon doesn't exist
});

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY?.replace(/^Bearer\s+/i, '').trim();
const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.openai.com/v1',
  defaultQuery: undefined,
  defaultHeaders: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Language prompts
const LANGUAGE_PROMPTS = {
  english: "Please provide a summary in English.",
  bosnian: "Molimo vas da sažetak dostavite na bosanskom/srpskom/hrvatskom jeziku.",
  german: "Bitte geben Sie eine Zusammenfassung auf Deutsch.",
  french: "Veuillez fournir un résumé en français.",
  spanish: "Por favor, proporcione un resumen en español.",
  italian: "Si prega di fornire un riassunto in italiano.",
  turkish: "Lütfen Türkçe bir özet sağlayın.",
  chinese: "请用中文提供摘要。",
  russian: "Пожалуйста, предоставьте краткое содержание на русском языке.",
  arabic: "يرجى تقديم ملخص باللغة العربية."
};

// Summary length configurations
const SUMMARY_LENGTHS = {
  short: {
    instruction: "Provide a very concise summary with 2-3 key points.",
    maxTokens: 100
  },
  medium: {
    instruction: "Provide a balanced summary with 4-5 key points.",
    maxTokens: 200
  },
  detailed: {
    instruction: "Provide a comprehensive summary with 6-8 key points.",
    maxTokens: 400
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'AI News Summarizer API is running' });
});

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test successful!' });
});

// Helper function to extract article content
async function extractArticleContent(url) {
  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Remove unwanted elements
    const unwantedElements = document.querySelectorAll('script, style, nav, header, footer, iframe, .ad, .advertisement, .social-share, .comments, .related-articles');
    unwantedElements.forEach(el => el.remove());
    
    // Get the main content
    const article = new Readability(document).parse();
    return article.textContent.trim();
  } catch (error) {
    console.error('Error extracting article content:', error);
    throw new Error('Failed to extract article content. Please check the URL and try again.');
  }
}

// Summarize route
app.post('/summarize', async (req, res) => {
  try {
    const { url, language = 'english', summaryLength = 'medium' } = req.body;

    // Validate inputs
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!LANGUAGE_PROMPTS[language]) {
      return res.status(400).json({ error: 'Invalid language selected' });
    }

    if (!SUMMARY_LENGTHS[summaryLength]) {
      return res.status(400).json({ error: 'Invalid summary length selected' });
    }

    console.log(`Processing request for URL: ${url}`);
    console.log(`Language: ${language}, Summary Length: ${summaryLength}`);

    // Extract article content
    const articleContent = await extractArticleContent(url);
    console.log('Article content extracted successfully');

    // Prepare the prompt
    const lengthConfig = SUMMARY_LENGTHS[summaryLength];
    const prompt = `${LANGUAGE_PROMPTS[language]}\n\n${lengthConfig.instruction}\n\nArticle content:\n${articleContent}`;

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional news summarizer. Provide clear, accurate, and well-structured summaries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: lengthConfig.maxTokens,
      temperature: 0.7
    });

    const summary = completion.choices[0].message.content.trim();
    console.log('Summary generated successfully');

    res.json({ summary });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 