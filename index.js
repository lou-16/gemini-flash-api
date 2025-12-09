import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.post("/evaluate-dpr", async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: "fileUrl is required in request body" });
    }

    const pdfResp = await fetch(fileUrl).then((response) => response.arrayBuffer());

    const contents = [
      { text: `You are an expert evaluator for the Ministry of Jal Shakti and Brahmaputra Board.  
Your task is to read the following DPR (Detailed Project Report) content and evaluate it strictly on the basis of the 5 field-worker performance parameters.

DPR CONTENT:
{{pdfResp}}

EVALUATION RULES:
1. Each parameter must receive FIVE independent evaluation scores.
2. Each score must be a number between 0 and 100.
3. Output only the numbers, formatted exactly as shown below. No explanations.

PARAMETERS TO EVALUATE:
1. Technical Quality & Engineering Accuracy of DPR  
2. Survey Accuracy, Data Completeness & Field Verification  
3. Evidence Completeness & Authenticity  
4. Compliance with DPR Format, Ministry Guidelines & Documentation Standards  
5. Progress Reporting Accuracy & Issue-Resolution Clarity  

OUTPUT FORMAT (STRICT):
TechnicalQuality: "num1,num2,num3,num4,num5"  
SurveyAccuracy: "num1,num2,num3,num4,num5"  
EvidencValidity: "num1,num2,num3,num4,num5"  
Compliance: "num1,num2,num3,num4,num5"  
ReportingClarity: "num1,num2,num3,num4,num5"

Example Output: (STRICT)
{
  "TechnicalQuality": [45, 46, 47, 44, 45],
  "SurveyAccuracy": [78, 79, 77, 76, 75],
  "EvidencValidity": [18, 17, 19, 16, 20],
  "Compliance": [98, 97, 99, 98, 96],
  "ReportingClarity": [65, 66, 67, 64, 68]
}

YOU MUST CHANGE THEN NAME OF THE PARAMETERS TO 

Do NOT add comments, descriptions, reasoning, or text outside the above format.
Return only the result.`},
      {
        inlineData: {
          mimeType: "application/pdf",
          data: Buffer.from(pdfResp).toString("base64")
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents
    });

    const resData = JSON.parse(response.text);
    
    res.json(resData);
  } catch (error) {
    console.error("Error processing DPR:", error);
    res.status(500).json({ error: "Failed to process DPR", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
