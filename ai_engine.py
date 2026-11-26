"""OpenAI-powered educational legal simulations. Never store API credentials in code."""
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
MODEL = os.getenv("LEGALMIND_MODEL", "gpt-4.1-mini")
GUIDANCE = (
    "You are LegalMind, an educational fictional law game for teenagers. "
    "Keep situations non-graphic, accurate in broad legal principles, and appropriate for minors. "
    "Never invent statute numbers, case citations, or quotations. Flag legal uncertainty and "
    "jurisdiction-dependent issues. This is fictional education, not legal advice. "
    "Return ONLY a valid JSON object with the requested keys. Do not use Markdown fences."
)


class AIError(Exception):
    pass


def ready():
    key = os.getenv("OPENAI_API_KEY", "").strip()
    return bool(key and not key.startswith("replace_with_"))


def ask(prompt):
    if not ready():
        raise AIError("Add a NEW API key to your local .env file first.")
    try:
        response = OpenAI(timeout=45.0, max_retries=1).responses.create(
            model=MODEL, instructions=GUIDANCE, input=prompt,
            max_output_tokens=1100, store=False,
        )
        raw = response.output_text.strip()
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("Not an object")
        return data
    except (json.JSONDecodeError, ValueError):
        raise AIError("AI produced invalid case data. Retry the request.") from None
    except Exception:
        # Do not expose raw API errors or request data in the interface.
        raise AIError("AI unavailable. Check your API key, network, billing, and model access.") from None


def field(data, key, limit=2400):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise AIError("AI response is missing required information. Please retry.")
    return value.strip()[:limit]


def case(jurisdiction, category, difficulty, mode="scenario"):
    jurisdiction, category, difficulty = (str(x)[:70] for x in (jurisdiction, category, difficulty))
    setting = "a fictional courtroom hearing with one witness who can be questioned" if mode == "courtroom" else "a legal issue-spotting challenge"
    data = ask(
        f"Create {setting} in {jurisdiction}, {category}, {difficulty} difficulty. "
        "Provide 90-150 words of facts and one legal question. "
        "Leave enough ambiguity for a defensible argument; never give away the answer. "
        "Return JSON keys: title, facts, question, witness_name, witness_background. "
        "For courtroom mode, witness_name and witness_background should identify a relevant fictional witness; "
        "for scenario mode those fields can be empty strings."
    )
    return {
        "title": field(data, "title", 120),
        "facts": field(data, "facts"),
        "question": field(data, "question", 500),
        "witness_name": str(data.get("witness_name", ""))[:90],
        "witness_background": str(data.get("witness_background", ""))[:600],
        "jurisdiction": jurisdiction, "category": category, "difficulty": difficulty,
        "mode": mode,
    }


def witness_reply(case_data, transcript, question):
    payload = json.dumps({"case": case_data, "transcript": transcript[-6:], "question": question[:650]})
    data = ask(
        "Roleplay a single fictional courtroom witness answering a question. "
        "Stay consistent with the established case facts and previous answers. "
        "Witnesses can be mistaken or uncertain but must not invent decisive evidence. "
        "Answer concisely in first person as a witness (not a romantic roleplay). "
        "Return JSON with string key reply. Data: " + payload
    )
    return field(data, "reply", 800)


def grade(case_data, argument, transcript=None):
    payload = json.dumps({
        "case": case_data, "witness_transcript": (transcript or [])[-6:],
        "argument": argument[:5000],
    })
    data = ask(
        "Evaluate the student's legal reasoning in this fictional case, not their real-world legal rights. "
        "Score 0 to 100 for issue spotting, clarity, identifying missing facts, and balanced legal analysis. "
        "Do not pretend legal citations were verified. If jurisdiction specifics are uncertain, say so. "
        "Return JSON keys: score (integer), feedback (2-4 sentences), "
        "strength (one sentence), improvement (one sentence). Data: " + payload
    )
    try:
        score = int(data["score"])
        if not 0 <= score <= 100:
            raise ValueError()
    except (ValueError, KeyError, TypeError):
        raise AIError("AI score was invalid; please retry.") from None
    return {
        "score": score, "feedback": field(data, "feedback", 1500),
        "strength": field(data, "strength", 600),
        "improvement": field(data, "improvement", 600),
    }
