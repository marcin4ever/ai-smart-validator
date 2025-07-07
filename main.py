from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from validator import validate_data, key_source

app = FastAPI()

# Allow requests from React frontend 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input model for POST request
class RecordInput(BaseModel):
    records: Any

@app.post("/validate")
async def validate(input: RecordInput):
    results, ks = validate_data(input.records, extra_rules=None)
    return {
        "results": results,
        "key_source": ks
    }
