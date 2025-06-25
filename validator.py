import requests
from dotenv import load_dotenv
import os
import json

load_dotenv()

# Streamlit secrets, then env variable


def get_api_key():
    try:
        import streamlit as st
        return st.secrets["GROQ_API_KEY"]
    except Exception:
        return os.getenv("GROQ_API_KEY")


headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {get_api_key()}"
}

# Field label mapping
FIELD_LABELS = {
    "matnr": "Material Number",
    "rstyp": "Reservation Type",
    "diffmg": "Difference Quantity",
    "pick_qty": "Picked Quantity",
    "sernr": "Serial Number",
    "source": "Source Type",
    "lgort": "Storage Location",
    "plnum": "Production Order Number",
    "werks": "Plant"
}


def label_record(record):
    return {
        FIELD_LABELS.get(k, k): v
        for k, v in record.items()
    }


def validate_data(records: list):
    results = []
    for idx, record in enumerate(records):
        labeled = label_record(record)
        prompt = f"""
You are a smart validator of SAP warehouse records.

Here is a record:
{json.dumps(labeled, indent=2)}

Your task:
- Identify any inconsistency or invalid value.
- Use logical reasoning to explain if the record is valid or not.

Respond in this JSON format:
{{
  "record_id": {idx},
  "llm_reasoning": "...",
  "status": "OK" or "Error"
}}
"""

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a helpful SAP validator assistant."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            results.append({
                "record_id": idx,
                "llm_reasoning": None,
                "status": f"Error: HTTP {response.status_code}, {response.text}"
            })
            continue

        try:
            llm_output = response.json()["choices"][0]["message"]["content"]
            parsed = json.loads(llm_output)
            results.append(parsed)
        except Exception as e:
            results.append({
                "record_id": idx,
                "llm_reasoning": llm_output if 'llm_output' in locals() else None,
                "status": f"Error: {str(e)}"
            })

    return results
