import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { useState } from 'react';
function App() {
    const [recordInput, setRecordInput] = useState('');
    const [result, setResult] = useState('');
    const handleValidate = async () => {
        try {
            const response = await fetch('http://localhost:8000/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: recordInput, // assuming raw JSON from user
            });
            const data = await response.json();
            setResult(JSON.stringify(data, null, 2));
        }
        catch (err) {
            setResult('❌ Error contacting backend.');
        }
    };
    return (_jsxs("div", { style: { padding: '2rem', fontFamily: 'sans-serif' }, children: [_jsx("h1", { children: "AI Smart Validator" }), _jsx("textarea", { value: recordInput, onChange: (e) => setRecordInput(e.target.value), rows: 10, cols: 60, placeholder: 'Paste your SAP record JSON here', style: { fontFamily: 'monospace', width: '100%' } }), _jsx("br", {}), _jsx("button", { onClick: handleValidate, style: { marginTop: '1rem' }, children: "Validate" }), _jsx("pre", { style: { backgroundColor: '#f4f4f4', marginTop: '2rem', padding: '1rem' }, children: result })] }));
}
export default App;
