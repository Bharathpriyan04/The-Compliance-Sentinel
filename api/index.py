"""
Vercel Serverless Function: FastAPI app
Serves /api/* routes via Python serverless function.
"""
import io
import json
import os
import traceback

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader

app = FastAPI(title="Compliance Sentinel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LLM Setup ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

gemini_available = False
genai = None
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai_mod
        genai = genai_mod
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_available = True
    except Exception:
        pass

groq_available = False
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        groq_available = True
    except Exception:
        pass


def call_gemini_json(prompt):
    if not gemini_available or genai is None:
        return {}
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        response = model.generate_content(prompt)
        parsed = json.loads(response.text)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def call_groq_json(prompt):
    if not groq_available or groq_client is None:
        return {}
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You must respond with valid JSON only. No markdown, no code fences, just raw JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1024,
        )
        result_text = response.choices[0].message.content.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[-1]
        if result_text.endswith("```"):
            result_text = result_text.rsplit("```", 1)[0]
        result_text = result_text.strip()
        parsed = json.loads(result_text)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def call_llm_json(prompt):
    result = call_gemini_json(prompt)
    if result:
        return result
    result = call_groq_json(prompt)
    if result:
        return result
    return {}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "gemini": gemini_available, "groq": groq_available}


@app.post("/api/analyze/upload")
async def analyze_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        contents = await file.read()
        reader = PdfReader(io.BytesIO(contents))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    except Exception:
        raise HTTPException(status_code=500, detail="Error extracting text from PDF.")

    if not text.strip():
        text = "No text found in PDF. Assuming standard terms."

    contract_snippet = text[:2000]

    # Agent 1: Legal
    legal_data = call_llm_json(f"You are a legal expert analyzing a contract. Find legal risks (termination clauses, liability limits). Return ONLY a JSON object with keys: 'risk' (High, Medium, or Low), 'description' (short text), and 'clause' (exact text of risky clause). Contract: {contract_snippet}")
    if not legal_data:
        legal_data = {"risk": "Medium", "description": "Unable to analyze legal risks.", "clause": "N/A"}

    # Agent 2: Privacy
    privacy_data = call_llm_json(f"You are a privacy expert analyzing a contract for GDPR and data risks. Return ONLY a JSON object with keys: 'risk' (High, Medium, or Low) and 'description' (short text). Contract: {contract_snippet}")
    if not privacy_data:
        privacy_data = {"risk": "Medium", "description": "Unable to analyze privacy risks."}

    # Agent 3: Finance
    finance_data = call_llm_json(f"You are a finance expert analyzing a contract for financial risks (fees, payment terms). Return ONLY a JSON object with keys: 'risk' (High, Medium, or Low) and 'description' (short text). Contract: {contract_snippet}")
    if not finance_data:
        finance_data = {"risk": "Medium", "description": "Unable to analyze financial risks."}

    # Agent 4: Security
    security_data = call_llm_json(f"You are a cybersecurity expert analyzing a contract for security risks. Return ONLY a JSON object with keys: 'risk' (High, Medium, or Low) and 'description' (short text). Contract: {contract_snippet}")
    if not security_data:
        security_data = {"risk": "Medium", "description": "Unable to analyze security risks."}

    # Moderator
    debate_data = call_llm_json(f"""You are a Moderator. Risk assessments from 4 experts:
Legal: {json.dumps(legal_data)}
Privacy: {json.dumps(privacy_data)}
Finance: {json.dumps(finance_data)}
Security: {json.dumps(security_data)}
Return ONLY a JSON object with keys: 'legal_view', 'reviewer_view', 'moderator_view'.""")
    if not debate_data:
        debate_data = {"legal_view": "Legal sees potential risks.", "reviewer_view": "Other agents did not flag critical issues.", "moderator_view": "Proceed with caution."}

    # Fix Agent
    clause_to_fix = legal_data.get('clause', 'No clause provided')
    fix_data = call_llm_json(f"""You are an AI Fix Agent. Risky clause: "{clause_to_fix}"
Risk: {legal_data.get('description', 'Unknown')}
Rewrite to be more fair. Return ONLY JSON with keys: 'original', 'improved', 'explanation'.""")
    if not fix_data:
        fix_data = {"original": clause_to_fix, "improved": "Error generating improvement.", "explanation": "LLM failed."}

    # Score
    risk_map = {"High": 3, "Medium": 2, "Low": 1}
    total_risk = sum(risk_map.get(d.get("risk", "Medium"), 2) for d in [legal_data, privacy_data, finance_data, security_data])
    score = 100 - int(((total_risk - 4) / 8) * 100)
    overall_risk = "High" if total_risk > 9 else "Medium" if total_risk > 6 else "Low"

    return {
        "filename": file.filename,
        "agents": {"legal": legal_data, "privacy": privacy_data, "finance": finance_data, "security": security_data},
        "debate": debate_data,
        "fix": fix_data,
        "score": score,
        "overall_risk": overall_risk
    }
