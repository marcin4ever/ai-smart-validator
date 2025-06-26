# AI Smart Validator
Smart data validation tool for validating SAP warehouse data using open-source LLMs (Mistral 7B / LLaMA 3), with Retrieval-Augmented Generation (RAG) techniques.

## Streamlit App
[Try the app on Streamlit](https://ai-smart-validator.streamlit.app/)

## What It Does
- Accepts input in JSON format (examples included in `test_data`)
- Offers two validation options:
  - **Basic Validation** — lets the LLM reason based on general logic
  - **RAG Validation** — augments the LLM with warehouse-specific rules
- Returns results per record: status (`OK` / `Error`) and explanation
- Summary displayed for quick insight

## Integration Possibilities
- Can be embedded or extended for:
  - SAP ECC (e.g. call from ALV toolbar)
  - SAP BTP (CAP-based APIs)
  - SAP AI Core *(doesn't require S/4HANA)*

## Author
Marcin Tkaczyk – [GitHub](https://github.com/marcin4ever) | [LinkedIn](https://www.linkedin.com/in/marcin-tkaczyk/)

## License
This project is licensed under the [MIT License](LICENSE).
