import streamlit as st
import json
from validator import validate_data

st.set_page_config(page_title="Smart Validator", layout="wide")

st.title("🤖 Smart Validator")
st.markdown(
    "Upload your JSON file to validate records using LLaMA 3 or Mistral 7B.")

uploaded_file = st.file_uploader("📁 Upload JSON File", type="json")

if uploaded_file:
    try:
        records = json.load(uploaded_file)
        if isinstance(records, list):
            st.success(f"Loaded {len(records)} records.")
            st.json(records)

            if st.button("🚀 Run Validation"):
                with st.spinner("Validating..."):
                    results = validate_data(records)
                st.success("Validation complete!")

                for result in results:
                    st.markdown(f"### Record #{result['record_id']}")
                    st.write("🔎 Status:", result["status"])
                    st.write("🧠 LLM Reasoning:")
                    st.code(result["llm_reasoning"]
                            or "No response", language="markdown")
        else:
            st.error("The JSON file must contain a list of records.")
    except Exception as e:
        st.error(f"Error reading JSON: {e}")
