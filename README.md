# AI Smart Validator

AI-powered Smart Data Validation tool for validating SAP warehouse records using open-source LLMs (Mistral 7B / LLaMA 3), with Retrieval-Augmented Generation (RAG) techniques.

## Try Me Out

- [Smart Validator via React](https://ai-smart-validator.vercel.app/)
- [Smart Validator via Streamlit (simplified)](https://ai-smart-validator.streamlit.app/)

## What It Does

AI Smart Validator allows SAP teams to validate logistics data using large language models (LLMs) such as Mistral 7B, enhanced with domain logic and RAG capabilities. Connected with SAP backend, it can exchange and update data for best logistics process outcomes in real-time.

### Features

- **Validation Modes**
  - **Basic**: Pure LLM reasoning on structured input
  - **RAG** (simplified for demo purposes): LLM + context from SAP-specific rules and warehouse documentation (via vector DB)

- **LLM Output**
  - Status per record (`OK` / `Error`)
  - Score per record (1–10 indicating data quality)
  - Detailed reasoning and explanation

- **Summary View**
  - Displays error counts, average score, execution details, and highlights

- **User Actions** *(demo mode only)*  
  For each record, user can:
  - **Accept**: Confirms the AI decision (`Accepted`).
  - **Reject**: Cancels the validation result (`Rejected`).
  - **Retry**: Re-runs validation for particular item (can be done after sensitivity change, or without).
  - **Email**: Opens a dialog box to send email with auto filled item content.
  - **Feedback**: Allows users to submit feedback used to improve future validations (fine tuning / ML).
  - **Worklist**: Adds the item to the user Worklist for follow-up or escalation (`Added to Worklist`).
  - **Sync to SAP**: Sends the validated result to SAP backend for update (not connected in demo mode).

## 📦 Architecture

- **Frontend**: React + Tailwind CSS; deployed to Vercel and Netlify
- **Backend**: FastAPI with Groq/Mistral API; hosted on Render 
- **Data Flow**: JSON input → LLM Reasoning → Results rendered per record
- **RAG Engine**: Vector-based Retrieval-Augmented Generation using ChromaDB  

## Integration Possibilities

- Can be embedded or extended for:
  - SAP ECC  
  - SAP BTP (CAP-based APIs)
  - SAP AI Core *(doesn't require S/4HANA)*
- System-agnostic — while optimized for SAP, can be adapted to other platforms.

## Author
Marcin Tkaczyk – [GitHub](https://github.com/marcin4ever) | [LinkedIn](https://www.linkedin.com/in/marcin-tkaczyk/)

## License
This project is licensed under the [MIT License](LICENSE).
