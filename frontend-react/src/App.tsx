import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';

interface ValidationResult {
    status: string;
    llm_reasoning: string;
    score?: number;
}

function App() {
    const [records, setRecords] = useState<any[]>([]);
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [keySource, setKeySource] = useState<string>('');
    const [summary, setSummary] = useState<{ ok: number; error: number; avgScore?: string }>({ ok: 0, error: 0 });
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

    const loadDemoFile = async () => {
        try {
            const response = await fetch('/test_data/demo_example_data.json');
            const json = await response.json();
            if (!Array.isArray(json)) {
                setFileError('The demo file must be a JSON array.');
                return;
            }
            setFileError('');
            setRecords(json);
        } catch (err) {
            setFileError('Failed to load demo example.');
        }
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

            const scored = resData.results.filter((r: any) => r.score !== null && r.score !== undefined);
            const avgScore = scored.length > 0
                ? (scored.reduce((sum: number, r: any) => sum + r.score, 0) / scored.length).toFixed(1)
                : null;

            setResults(resData.results);
            setSummary({ ok: okCount, error: resData.results.length - okCount, avgScore: avgScore });
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


                    <h1 className="text-2xl font-bold text-blue-700 text-center mb-2">Smart Validator via React</h1>
                    <p className="text-center font-medium text-gray-500 mb-6">
                        Upload your data to validate records using LLaMA 3 or Mistral 7B. (Standalone mode, no backend connected)
                    </p>


                    <div className="flex items-center gap-4 mb-4">
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md border border-gray-300">
                            Choose Your JSON File
                            <input type="file" accept="application/json" onChange={handleFileChange} hidden />
                        </label>

                        <span className="text-gray-500 font-medium">or</span>

                        <button
                            onClick={() => loadDemoFile()}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-normal px-3 py-1 rounded-md border border-gray-300"
                        >
                            Use Demo Example
                        </button>
                    </div>

                    {fileError && <p className="text-red-500 mb-2">{fileError}</p>}

                    {records.length > 0 && (
                        <>
                            <p className="text-green-600 mb-2">Loaded {records.length} records.</p>
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={() => runValidation(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
                                >
                                    Run Validation
                                </button>
                                <button
                                    onClick={() => runValidation(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
                                >
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
                                <hr className="my-4 border-t border-gray-300" />
                                <p className="font-semibold">Summary:</p>
                                {summary.ok > 0 && (
                                    <p className="text-green-600 font-bold">✅ {summary.ok} OK</p>
                                )}
                                {summary.error > 0 && (
                                    <p className="text-red-600 font-bold">❌ {summary.error} Errors</p>
                                )}
                                {summary.avgScore && (
                                    <p className="text-gray-600 font-medium">
                                        {parseFloat(summary.avgScore) >= 8 ? '✅' :
                                            parseFloat(summary.avgScore) >= 5 ? '⚠️' :
                                                '❌'} Avg Score: {summary.avgScore}/10
                                    </p>
                                )}
                            </div>

                            <hr className="mb-4" />
                            {results.map((result, idx) => (
                                <div key={idx} className="bg-white shadow-md rounded-xl p-4 my-4 border border-gray-200">
                                    <h3 className="font-semibold text-lg">Item {idx + 1}:</h3>
                                    <div className="text-sm text-gray-600 mt-1 flex gap-4 items-center flex-wrap">
                                        <span>
                                            <span className="font-semibold">Status:</span>
                                            <span className={`ml-1 font-bold ${result.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                                                {result.status}
                                            </span>
                                        </span>

                                        {result.score !== undefined && (
                                            <span>
                                                <span className="font-semibold">Score:</span>
                                                <span className="ml-1">
                                                    {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}/10
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-gray-700">{result.llm_reasoning}</p>
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

