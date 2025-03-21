import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Language configurations
const LANGUAGES = {
  english: {
    code: 'en',
    systemPrompt: "You are a professional news summarizer. Create concise, accurate summaries that capture the main points while maintaining context and key details. Format the summary in a clear, readable way with bullet points for key takeaways.",
    translationPrompt: null // No translation needed for English
  },
  bosnian: {
    code: 'bs',
    systemPrompt: "Vi ste profesionalni rezimator vijesti. Kreirajte sažete, precizne sažetke koji obuhvataju glavne tačke uz očuvanje konteksta i ključnih detalja. Formatirajte sažetak na jasan, čitljiv način sa tačkama za ključne zaključke.",
    translationPrompt: "Translate the following text to Bosnian/Serbian/Croatian (BSC), maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  german: {
    code: 'de',
    systemPrompt: "Sie sind ein professioneller Nachrichtenzusammenfasser. Erstellen Sie prägnante, genaue Zusammenfassungen, die die Hauptpunkte erfassen und dabei Kontext und wichtige Details beibehalten. Formatieren Sie die Zusammenfassung übersichtlich mit Aufzählungspunkten für die wichtigsten Erkenntnisse.",
    translationPrompt: "Translate the following text to German, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  french: {
    code: 'fr',
    systemPrompt: "Vous êtes un résumeur professionnel d'actualités. Créez des résumés concis et précis qui capturent les points principaux tout en maintenant le contexte et les détails clés. Formatez le résumé de manière claire et lisible avec des puces pour les points essentiels.",
    translationPrompt: "Translate the following text to French, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  spanish: {
    code: 'es',
    systemPrompt: "Eres un resumidor profesional de noticias. Crea resúmenes concisos y precisos que capturen los puntos principales mientras mantienes el contexto y los detalles clave. Formatea el resumen de manera clara y legible con viñetas para los puntos clave.",
    translationPrompt: "Translate the following text to Spanish, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  italian: {
    code: 'it',
    systemPrompt: "Sei un riassuntore professionale di notizie. Crea riassunti concisi e accurati che catturino i punti principali mantenendo il contesto e i dettagli chiave. Formatta il riassunto in modo chiaro e leggibile con punti elenco per i punti chiave.",
    translationPrompt: "Translate the following text to Italian, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  turkish: {
    code: 'tr',
    systemPrompt: "Profesyonel bir haber özetleyicisisiniz. Bağlamı ve önemli detayları korurken ana noktaları yakalayan özlü, doğru özetler oluşturun. Özeti, önemli noktalar için madde işaretleriyle net ve okunabilir bir şekilde biçimlendirin.",
    translationPrompt: "Translate the following text to Turkish, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  chinese: {
    code: 'zh',
    systemPrompt: "您是一位专业的新闻摘要员。创建简洁、准确的摘要，在保持上下文和关键细节的同时捕捉要点。使用项目符号清晰、易读地格式化摘要以突出关键要点。",
    translationPrompt: "Translate the following text to Chinese (Simplified), maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  russian: {
    code: 'ru',
    systemPrompt: "Вы профессиональный составитель новостных сводок. Создавайте краткие, точные сводки, которые отражают основные моменты, сохраняя контекст и ключевые детали. Форматируйте сводку четко и разборчиво, используя маркированные пункты для ключевых моментов.",
    translationPrompt: "Translate the following text to Russian, maintaining the bullet point format and ensuring the translation is natural and fluent:"
  },
  arabic: {
    code: 'ar',
    systemPrompt: "أنت ملخص أخبار محترف. قم بإنشاء ملخصات موجزة ودقيقة تلتقط النقاط الرئيسية مع الحفاظ على السياق والتفاصيل الأساسية. قم بتنسيق الملخص بطريقة واضحة وسهلة القراءة مع نقاط رئيسية للنقاط الأساسية.",
    translationPrompt: "Translate the following text to Arabic, maintaining the bullet point format and ensuring the translation is natural and fluent. Ensure proper right-to-left formatting:"
  }
};

// Summary length configurations
const lengthConfigs = {
  short: {
    instruction: "Create a very brief summary in 2-3 bullet points, focusing only on the most crucial information.",
    maxTokens: 200
  },
  medium: {
    instruction: "Provide a balanced summary with 4-5 bullet points, covering the main points and key supporting details.",
    maxTokens: 350
  },
  detailed: {
    instruction: "Create a comprehensive summary with 6-8 bullet points, including main points, supporting details, and relevant context.",
    maxTokens: 500
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Test route
app.post('/test', (req, res) => {
  res.json({ message: 'Test successful!' });
});

// Helper function to extract main content from HTML
async function extractArticleContent(url) {
  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    return article ? article.textContent : '';
  } catch (error) {
    console.error('Error extracting article content:', error);
    throw new Error('Failed to extract article content');
  }
}

// Helper function to translate text
async function translateText(text, language) {
  if (!LANGUAGES[language].translationPrompt) {
    return text; // Return original text for English
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional translator. Provide accurate translations while maintaining the original format and style."
        },
        {
          role: "user",
          content: `${LANGUAGES[language].translationPrompt}\n\n${text}`
        }
      ],
      model: "gpt-4-turbo-preview",
      temperature: 0.3,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Failed to translate the summary');
  }
}

// Summarize route
app.post('/summarize', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { url, language = 'english', summaryLength = 'medium' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate language
    if (!LANGUAGES[language]) {
      return res.status(400).json({ error: 'Invalid language selected' });
    }

    // Validate summary length
    if (!lengthConfigs[summaryLength]) {
      return res.status(400).json({ error: 'Invalid summary length selected' });
    }

    console.log('Extracting content from:', url);
    // Extract article content
    const articleContent = await extractArticleContent(url);
    
    if (!articleContent) {
      return res.status(400).json({ error: 'Could not extract article content' });
    }

    console.log('Generating summary...');
    // Generate summary in English first
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: language === 'english' 
            ? LANGUAGES.english.systemPrompt 
            : `${LANGUAGES.english.systemPrompt}\n\nGenerate the summary in English first, it will be translated afterward.`
        },
        {
          role: "user",
          content: `${lengthConfigs[summaryLength].instruction}\n\nPlease summarize this news article:\n\n${articleContent}`
        }
      ],
      model: "gpt-4-turbo-preview",
      temperature: 0.7,
      max_tokens: lengthConfigs[summaryLength].maxTokens
    });

    const englishSummary = completion.choices[0].message.content;

    // Translate if necessary
    console.log('Translating summary...');
    const finalSummary = await translateText(englishSummary, language);

    console.log('Summary generated and translated successfully');
    res.json({ summary: finalSummary });
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