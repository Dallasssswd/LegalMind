"""LegalMind Web: local-only Flask server; session keys are never persisted."""
import json
import os
from flask import Flask, jsonify, render_template, request
from openai import OpenAI
from ai_engine import GUIDANCE

app = Flask(__name__, template_folder="web_templates", static_folder="web_static")
app.config["MAX_CONTENT_LENGTH"] = 32000
MODEL = os.getenv("LEGALMIND_MODEL", "gpt-4.1-mini")
CATEGORIES = {"Constitutional Law", "Criminal Law", "Cyber Law", "Civil Law", "Business Law"}
DIFFICULTIES = {"Easy", "Medium", "Hard", "Expert"}
JURISDICTIONS = {"North Carolina", "Federal (U.S.)", "South Carolina", "California", "New York"}

def require(data, name, limit):
    value = data.get(name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Missing " + name)
    return value.strip()[:limit]

def ask(key, prompt):
    try:
        result = OpenAI(api_key=key, timeout=45.0, max_retries=1).responses.create(
            model=MODEL, instructions=GUIDANCE, input=prompt,
            max_output_tokens=1200, store=False
        )
        obj = json.loads(result.output_text.strip())
        if not isinstance(obj, dict):
            raise ValueError("Bad response")
        return obj
    except Exception:
        raise RuntimeError("AI request failed. Check API billing, key, network and model access.") from None

@app.after_request
def headers(response):
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; "
        "object-src 'none'; frame-ancestors 'none'"
    )
    return response

@app.get("/")
def index():
    return render_template("index.html")

@app.post("/api/<action>")
def api(action):
    if action not in {"case", "witness", "grade"}:
        return jsonify(error="Unknown action"), 404
    origin = request.headers.get("Origin")
    if origin and origin != request.host_url.rstrip("/"):
        return jsonify(error="Invalid origin"), 403
    if not request.is_json:
        return jsonify(error="Expected JSON"), 400
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Invalid request"), 400
    key = data.get("api_key")
    if not isinstance(key, str) or not key.startswith("sk-") or len(key) > 512:
        return jsonify(error="Enter a key in Settings"), 400
    try:
        if action == "case":
            jurisdiction = require(data, "jurisdiction", 80)
            category = require(data, "category", 80)
            difficulty = require(data, "difficulty", 30)
            mode = require(data, "mode", 20)
            if (jurisdiction not in JURISDICTIONS or category not in CATEGORIES
                or difficulty not in DIFFICULTIES or mode not in {"scenario", "courtroom"}):
                raise ValueError("Unknown game configuration")
            setting = "a courtroom hearing with a fictional witness" if mode == "courtroom" else "a legal issue-spotting scenario"
            result = ask(key, f"Create {setting}, {difficulty} difficulty, in {jurisdiction}, focusing on {category}. "
                "Include 90-150 words of nuanced, age-appropriate, non-graphic facts and a question without a solution. "
                "Return JSON string fields title, facts, question, witness_name, witness_background. "
                "Witness fields can be empty for scenario mode.")
            return jsonify(title=require(result, "title", 120), facts=require(result, "facts", 2500),
                question=require(result, "question", 500),
                witness_name=str(result.get("witness_name") or "")[:100],
                witness_background=str(result.get("witness_background") or "")[:600],
                jurisdiction=jurisdiction, category=category, difficulty=difficulty, mode=mode)

        original = data.get("case")
        if not isinstance(original, dict):
            raise ValueError("Missing case")
        case = {k:str(original.get(k, ""))[:2500] for k in
                ("title", "facts", "question", "jurisdiction", "category", "difficulty", "mode",
                 "witness_name", "witness_background")}
        raw_transcript = data.get("transcript", [])
        if not isinstance(raw_transcript, list):
            raise ValueError("Invalid transcript")
        transcript = [{"role":str(x.get("role",""))[:20], "text":str(x.get("text",""))[:650]}
                      for x in raw_transcript[-12:] if isinstance(x, dict)]
        if action == "witness":
            question = require(data, "question", 650)
            response = ask(key, "Play a fictional courtroom witness answering concisely and consistently. "
                "Do not invent decisive facts. Return JSON with a string field reply. "
                "Context: " + json.dumps({"case":case,"transcript":transcript,"question":question}))
            return jsonify(reply=require(response, "reply", 800))

        argument = require(data, "argument", 5000)
        if len(argument) < 25:
            raise ValueError("Please provide a longer legal argument")
        response = ask(key, "Evaluate fictional legal reasoning for issue spotting, balanced analysis, "
            "clarity and recognition of uncertainty. No fabricated citations. "
            "Return JSON with score (integer from 0 to 100), feedback (2-4 sentences), "
            "strength (one sentence), improvement (one sentence). Context: "
            + json.dumps({"case":case, "transcript":transcript, "argument":argument}))
        score = int(response.get("score", -1))
        if score not in range(101):
            raise ValueError("Invalid AI score")
        return jsonify(score=score, feedback=require(response, "feedback", 1500),
            strength=require(response, "strength", 700),
            improvement=require(response, "improvement", 700))
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 502

if __name__ == "__main__":
    # Local development only. Do not expose to the public internet.
    app.run(host="127.0.0.1", port=5050, debug=False)
