import streamlit as st
import json
from validator import validate_data, key_source

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

            if st.button("Run Validation"):
                with st.spinner("Validating..."):
                    results, key_source = validate_data(records)
                st.success("✅ >>> Validation complete <<< ✅")
                st.info(f"{key_source}")  # which API source was used

                ok_count = sum(1 for r in results if r["status"] == "OK")
                error_count = len(results) - ok_count
                st.markdown(
                    f"Summary:  \n✅ {ok_count} OK  \n❌ {error_count} Errors")
                st.markdown("---")

                for idx, result in enumerate(results, start=1):
                    st.markdown(f"### Item #{idx}")
                    st.write("⬛ Status:", result["status"])
                    st.write("⬛ LLM Reasoning:")
                    st.code(result["llm_reasoning"]
                            or "No response", language="markdown")
        else:
            st.error("The JSON file must contain a list of records.")
    except Exception as e:
        st.error(f"Error reading JSON: {e}")
