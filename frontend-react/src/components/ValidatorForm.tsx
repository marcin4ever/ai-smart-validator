import React, { useState } from 'react';

const ValidatorForm = () => {
    const [jsonFile, setJsonFile] = useState<File | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setJsonFile(file);
        }
    };

    const handleValidate = async () => {
        if (!jsonFile) return;

        try {
            const text = await jsonFile.text();
            const parsed = JSON.parse(text);

            const response = await fetch('http://localhost:8000/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: Array.isArray(parsed) ? parsed : [parsed] })
            });

            const result = await response.json();
            setResponse(result);
            setError(null);
        } catch (err: any) {
            setError('Failed to validate: ' + err.message);
            setResponse(null);
        }
    };

    return (
        <div>
            <h2>Smart Validator (React)</h2>
            <input type="file" accept="application/json" onChange={handleFileChange} />
            <button onClick={handleValidate} disabled={!jsonFile}>Run Validation</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {response && (
                <div>
                    <h3>Validation Results:</h3>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default ValidatorForm;
