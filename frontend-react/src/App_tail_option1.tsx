import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

interface ValidationResult {
    status: string;
    llm_reasoning: string;
}

function App() {
    const [records, setRecords] = useState<any[]>([]);
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [keySource, setKeySource] = useState<string>('');
    const [summary, setSummary] = useState<{ ok: number; error: number }>({ ok: 0, error: 0 });
    const [loading, setLoading] = useState<boolean>(false);
    const [fileError, setFileError] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!Array.isArray(json)) {
                    setFileError('The JSON must be an array of records.');
                    return;
                }
                setFileError('');
                setRecords(json);
            } catch (err) {
                setFileError('Invalid JSON format.');
            }
        };
        reader.readAsText(file);
    };

    const runValidation = async (useRag: boolean) => {
        setLoading(true);
        try {
            const endpoint = 'http://localhost:8000/validate';
            const response = await axios.post(endpoint, {
                records,
                use_rag: useRag
            });
            const resData = response.data;

            const okCount = resData.results.filter((r: any) => r.status === 'OK').length;
            setResults(resData.results);
            setSummary({ ok: okCount, error: resData.results.length - okCount });
            setKeySource(resData.key_source || 'API Unknown');
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white p-6 shadow rounded">


                    <h1 className="text-3xl font-bold text-blue-700 text-center mb-4">Smart Validator via React</h1>

                    <p className="mb-4">Upload your JSON file to validate records using LLaMA 3 or Mistral 7B.</p>

                    <input type="file" accept="application/json" onChange={handleFileChange} className="mb-4" />
                    {fileError && <p className="text-red-500 mb-2">{fileError}</p>}

                    {records.length > 0 && (
                        <>
                            <p className="text-green-600 mb-2">Loaded {records.length} records.</p>
                            <div className="flex gap-4 mb-4">
                                <button onClick={() => runValidation(false)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                    Run Validation
                                </button>
                                <button onClick={() => runValidation(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                    Run with RAG WM Rules
                                </button>
                            </div>
                        </>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center mt-4 text-gray-700">
                            <ClipLoader size={24} color="#2563EB" />
                            <span className="mt-2">Validating...</span>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="mt-6">
                            <p className="text-gray-800 mb-2">API Used: {keySource}</p>
                            <div className="mb-4 space-y-1">
                                <p className="font-semibold">Summary:</p>
                                <p className="text-black-600 font-bold">✅ {summary.ok} OK</p>
                                <p className="text-red-600 font-bold">❌ {summary.error} Errors</p>
                            </div>
                            <hr className="mb-4" />
                            {results.map((result, idx) => (
                                <div key={idx} className="mb-4 p-4 bg-white shadow rounded">
                                    <h3 className="text-lg font-semibold">Item {idx + 1}:</h3>
                                    <p>Status: <span className={`${result.status === 'OK' ? 'text-green-600' : 'text-red-600'} font-bold`}>{result.status}</span></p>
                                    <div className="prose">
                                        <p>Reason: {result.llm_reasoning}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;

