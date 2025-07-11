import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
function App() {
    const [records, setRecords] = useState([]);
    const [results, setResults] = useState([]);
    const [keySource, setKeySource] = useState('');
    const [summary, setSummary] = useState({ ok: 0, error: 0 });
    const [loading, setLoading] = useState(false);
    const [fileError, setFileError] = useState('');
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result);
                if (!Array.isArray(json)) {
                    setFileError('The JSON must be an array of records.');
                    return;
                }
                setFileError('');
                setRecords(json);
            }
            catch (err) {
                setFileError('Invalid JSON format.');
            }
        };
        reader.readAsText(file);
    };
    const runValidation = async (useRag) => {
        setLoading(true);
        try {
            const endpoint = 'http://localhost:8000/validate';
            const response = await axios.post(endpoint, {
                records,
                use_rag: useRag
            });
            const resData = response.data;
            const okCount = resData.results.filter((r) => r.status === 'OK').length;
            setResults(resData.results);
            setSummary({ ok: okCount, error: resData.results.length - okCount });
            setKeySource(resData.key_source || 'API Unknown');
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-100 py-8", children: _jsx("div", { className: "max-w-4xl mx-auto px-4", children: _jsxs("div", { className: "bg-white p-6 shadow rounded", children: [_jsx("h1", { className: "text-3xl font-bold text-blue-700 text-center mb-4", children: "Smart Validator via React" }), _jsx("p", { className: "mb-4", children: "Upload your JSON file to validate records using LLaMA 3 or Mistral 7B." }), _jsx("input", { type: "file", accept: "application/json", onChange: handleFileChange, className: "mb-4" }), fileError && _jsx("p", { className: "text-red-500 mb-2", children: fileError }), records.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-green-600 mb-2", children: ["Loaded ", records.length, " records."] }), _jsxs("div", { className: "flex gap-4 mb-4", children: [_jsx("button", { onClick: () => runValidation(false), className: "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600", children: "Run Validation" }), _jsx("button", { onClick: () => runValidation(true), className: "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600", children: "Run with RAG WM Rules" })] })] })), loading && (_jsxs("div", { className: "flex flex-col items-center mt-4 text-gray-700", children: [_jsx(ClipLoader, { size: 24, color: "#2563EB" }), _jsx("span", { className: "mt-2", children: "Validating..." })] })), !loading && results.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsxs("p", { className: "text-gray-800 mb-2", children: ["API Used: ", keySource] }), _jsxs("div", { className: "mb-4 space-y-1", children: [_jsx("p", { className: "font-semibold", children: "Summary:" }), _jsxs("p", { className: "text-black-600 font-bold", children: ["\u2705 ", summary.ok, " OK"] }), _jsxs("p", { className: "text-red-600 font-bold", children: ["\u274C ", summary.error, " Errors"] })] }), _jsx("hr", { className: "mb-4" }), results.map((result, idx) => (_jsxs("div", { className: "mb-4 p-4 bg-white shadow rounded", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["Item ", idx + 1, ":"] }), _jsxs("p", { children: ["Status: ", _jsx("span", { className: `${result.status === 'OK' ? 'text-green-600' : 'text-red-600'} font-bold`, children: result.status })] }), _jsx("div", { className: "prose", children: _jsxs("p", { children: ["Reason: ", result.llm_reasoning] }) })] }, idx)))] }))] }) }) }));
}
export default App;
