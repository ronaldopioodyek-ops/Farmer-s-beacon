import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { ZipArchive } from "archiver";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

// We will initialize the AI client lazily when needed
let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// JSON body parser middleware
app.use(express.json());

// API route for agricultural AI expert consultations
app.post("/api/consult", async (req, res) => {
  try {
    const { query, category, history } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API Key is not configured on the server. Please add it to your secrets."
      });
    }

    // System instruction to guide the model as an agricultural expert
    const systemInstruction = `You are a highly experienced agricultural consultant, veterinary expert, and crop specialist. 
Your goal is to provide deep, practical, and highly accurate advice to farmers regarding crops, livestock, soil health, pest management, and general farm practices.
- Give structured, easy-to-read responses using bullet points and clear section headings.
- Be supportive, encouraging, and empathetic to the struggles of small-scale and commercial farmers.
- Emphasize organic and sustainable solutions alongside safe chemical applications where necessary.
- Keep the tone professional, humble, and practical. Avoid overly complex academic jargon. 
- The farmer's inquiry is categorized as: ${category || "General Agriculture"}.`;

    const contents = [];
    
    // Add history if present
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }

    // Append the current query
    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      response: response.text || "I apologize, but I could not formulate an advice for this query. Please try rephrasing."
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Failed to generate agricultural consultation advice. " + (error instanceof Error ? error.message : String(error))
    });
  }
});

// API route to download the entire source code as a ZIP file
app.get("/api/export-source", (req, res) => {
  res.attachment('farmers-beacon-source.zip');
  
  const archive = new ZipArchive({
    zlib: { level: 9 } // Sets the compression level.
  });

  archive.on('error', function(err) {
    res.status(500).send({error: err.message});
  });

  // Pipe archive data to the response
  archive.pipe(res);

  // Add the entire workspace directory, but ignore node_modules and dist and .git
  archive.glob('**/*', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', 'dist/**', '.git/**']
  });

  archive.finalize();
});

// Hook Vite middleware in development or serve static build files in production
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving production static assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupApp();
