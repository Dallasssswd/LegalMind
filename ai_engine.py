"""OpenAI integration foundation for future LegalMind gameplay.

Create a fresh API key after revoking any exposed key.
The client reads OPENAI_API_KEY from a local .env file.
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def generate_scenario(jurisdiction="North Carolina", area="constitutional law"):
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is missing. Set it in your local .env file.")
    client = OpenAI()
    result = client.responses.create(
        model="gpt-4.1-mini",
        instructions=(
            "You create fictional legal education scenarios for a teen-friendly "
            "legal reasoning game. Clearly distinguish established law from "
            "uncertain facts. Never fabricate citations or claim an AI answer "
            "is authoritative legal advice. Avoid graphic details."
        ),
        input=f"Create a brief fictional scenario about {area} in {jurisdiction}. "
              "Include facts, a legal question, and important issues to examine. "
              "Do not provide the solution yet."
    )
    return result.output_text
