import requests
from dotenv import load_dotenv
import os

load_dotenv()  # Loads .env file into environment

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}"
}


def validate_data(records: list):
    results = []
    for idx, record in enumerate(records):
        prompt = f"You are a smart SAP validator. Validate this: {record}"

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
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
            results.append({
                "record_id": idx,
                "llm_reasoning": llm_output,
                "status": "OK"
            })
        except Exception as e:
            results.append({
                "record_id": idx,
                "llm_reasoning": None,
                "status": f"Error: {str(e)}"
            })

    return results
