// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import RunControls from './components/RunControls';

interface ValidationResult {
    record_id: number | string;
    status: string;
    llm_reasoning: string;
    score?: number;

    // UI interaction state (used throughout App.tsx)
    marked?: boolean;
    accepted?: boolean;
    rejected?: boolean;
    retried?: boolean;
    worklisted?: boolean;
}

function App() {
    const [records, setRecords] = useState<any[]>([]);
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [keySource, setKeySource] = useState<string>('');
    const [summary, setSummary] = useState<{ ok: number; error: number; avgScore?: string }>({ ok: 0, error: 0 });
    const [loading, setLoading] = useState<boolean>(false);
    const [fileError, setFileError] = useState<string>('');
    const [feedbackItemId, setFeedbackItemId] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState<string>('');
    const [temperature, setTemperature] = useState<number>(0.7);
    const [advancedTemp, setAdvancedTemp] = useState<boolean>(false);

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
            const endpoint = `${import.meta.env.VITE_API_URL}/validate`
            const response = await axios.post(endpoint, {
                records,
                use_rag: useRag,
                temperature: temperature,
                source: "react"
            });
            const resData = response.data;

            const resultsWithMarked = resData.results.map((r: any) => ({
                ...r,
                marked: false,
                accepted: false,
                rejected: false,
                retried: false,
                feedbackSent: false,
                emailed: false,
                worklisted: false
            }));

            const okCount = resultsWithMarked.filter((r) => r.status === 'OK').length;

            const scored = resultsWithMarked.filter((r) => r.score !== null && r.score !== undefined);
            const avgScore = scored.length > 0
                ? (scored.reduce((sum, r) => sum + r.score, 0) / scored.length).toFixed(1)
                : null;

            setResults(resultsWithMarked);
            setSummary({ ok: okCount, error: resultsWithMarked.length - okCount, avgScore });
            setKeySource(resData.key_source || 'API Unknown');

        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMarked = (recordId: number) => {
        setResults((prevResults) =>
            prevResults.map((r) =>
                r.record_id === recordId ? { ...r, marked: !r.marked } : r
            )
        );
    };

    const handleAccept = (recordId: number) => {
        setResults(prev =>
            prev.map(r =>
                r.record_id === recordId ? { ...r, accepted: !r.accepted } : r
            )
        );
    };

    const handleReject = (recordId: number) => {
        setResults(prev =>
            prev.map(r =>
                r.record_id === recordId ? { ...r, rejected: !r.rejected } : r
            )
        );
    };

    const handleRetry = async (recordId: number) => {
        const index = results.findIndex(r => r.record_id === recordId);
        const recordToRetry = records[index];
        if (!recordToRetry) return;

        // Show “Executing…” state
        setResults(prev =>
            prev.map(r =>
                r.record_id === recordId ? { ...r, retried: true } : r
            )
        );

        try {
            const endpoint = `${import.meta.env.VITE_API_URL}/validate`;
            const response = await axios.post(endpoint, {
                records: [recordToRetry],
                use_rag: false
            });

            const retried = response.data.results[0];

            // ⬇️ Update results with the retried record
            const updatedResults = results.map((r, idx) =>
                r.record_id === recordId
                    ? {
                        ...retried,
                        accepted: r.accepted,
                        rejected: r.rejected,
                        marked: r.marked,
                        retried: false
                    }
                    : r
            );

            // ⬇️ Recalculate summary (OK count, error count, avgScore)
            const okCount = updatedResults.filter(r => r.status === 'OK').length;
            const scored = updatedResults.filter(r => r.score !== null && r.score !== undefined);
            const avgScore = scored.length > 0
                ? (scored.reduce((sum, r) => sum + r.score!, 0) / scored.length).toFixed(1)
                : null;

            setResults(updatedResults);
            setSummary({ ok: okCount, error: updatedResults.length - okCount, avgScore });

        } catch (err) {
            console.error('Retry failed:', err);
            setResults(prev =>
                prev.map(r =>
                    r.record_id === recordId ? { ...r, retried: false } : r
                )
            );
        }
    };


    const handleFeedbackOpen = (recordId: number) => {
        setFeedbackItemId(recordId);
        setFeedbackText('');
    };

    const handleFeedbackClose = () => {
        setFeedbackItemId(null);
        setFeedbackText('');
    };

    const handleEmail = (recordId: number) => {
        const result = results.find(r => r.record_id === recordId);
        if (!result) return;

        const subject = `Validation Result for Item ${recordId + 1}`;
        const body = `Status: ${result.status}
Score: ${result.score}
Reasoning:
${result.llm_reasoning}`;

        const html = `
    <html>
      <head>
        <title>Compose Email</title>
        <style>
          body { font-family: sans-serif; padding: 1rem; }
          input, textarea { width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; }
          label { font-weight: bold; margin-bottom: 4px; display: block; }
          textarea { height: 200px; resize: vertical; }
        </style>
      </head>
      <body>
        <h2>Send Email</h2>
        <label>To:</label>
        <input type="text" value="example@company.com" />
        
        <label>Cc:</label>
        <input type="text" value="" />
        
        <label>Subject:</label>
        <input type="text" value="${subject}" />
        
        <label>Body:</label>
        <textarea>${body}</textarea>

        <p style="margin-top: 1rem; font-style: italic; color: #666;">
          For demo purposes only. No message will be sent.
        </p>
      </body>
    </html>
  `;

        const newWindow = window.open('', '_blank', 'width=700,height=600');
        if (newWindow) {
            newWindow.document.write(html);
            newWindow.document.close();
        }
    };

    const handleWorklist = (recordId: number) => {
        setResults(prev =>
            prev.map(r =>
                r.record_id === recordId ? { ...r, worklisted: true } : r
            )
        );
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white p-8 shadow-xl rounded-lg">
                    <Header />
                    <UploadSection
                        handleFileChange={handleFileChange}
                        loadDemoFile={loadDemoFile}
                    />

                    {fileError && <p className="text-red-500 mb-2">{fileError}</p>}

                    <RunControls
                        records={records}
                        runValidation={runValidation}
                        temperature={temperature}
                        setTemperature={setTemperature}
                        advancedTemp={advancedTemp}
                        setAdvancedTemp={setAdvancedTemp}
                    />

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
                                    <p className="text-red-600 font-bold">❌ {summary.error} {summary.error === 1 ? 'Error' : 'Errors'}</p>
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
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">Item {idx + 1}:</h3>
                                        <button
                                            onClick={() => toggleMarked(result.record_id)}
                                            className="transition transform hover:scale-110"
                                            title={result.marked ? "Unmark" : "Mark for Review"}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill={result.marked ? "red" : "transparent"}
                                                viewBox="0 0 24 24"
                                                stroke="red"
                                                className="w-6 h-6"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.683a1 1 0 00.95.69h3.862c.969 0 1.371 1.24.588 1.81l-3.124 2.27a1 1 0 00-.364 1.118l1.2 3.683c.3.921-.755 1.688-1.538 1.118l-3.124-2.27a1 1 0 00-1.176 0l-3.124 2.27c-.783.57-1.838-.197-1.538-1.118l1.2-3.683a1 1 0 00-.364-1.118L2.449 9.11c-.783-.57-.38-1.81.588-1.81h3.862a1 1 0 00.95-.69l1.2-3.683z"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="text-sm text-gray-600 mt-1 flex gap-4 items-center flex-wrap">
                                        <span>
                                            <span className="font-semibold">Status:</span>
                                            <span className={`ml-1 font-bold ${result.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                                                {result.status}
                                            </span>
                                        </span>

                                        {result.score !== undefined && result.score !== null && (
                                            <span>
                                                <span className="font-semibold">Score:</span>
                                                <span className="ml-1">
                                                    {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}/10
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-gray-700">{result.llm_reasoning}</p>
                                    <div className="flex justify-start items-center gap-2 text-sm text-gray-700 border-t pt-2 mt-4 border-gray-200">
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button
                                                disabled={result.rejected}
                                                onClick={() => handleAccept(result.record_id)}
                                                className={
                                                    `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                    (result.accepted
                                                        ? 'bg-gray-200 text-gray-500'
                                                        : result.rejected
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'border-gray-300 hover:bg-green-100 hover:shadow-md')
                                                }
                                            >
                                                {result.accepted ? '✅ Accepted' : '✅ Accept'}
                                            </button>



                                            <button
                                                disabled={result.accepted}
                                                onClick={() => handleReject(result.record_id)}
                                                className={
                                                    `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                    (result.rejected
                                                        ? 'bg-red-200 text-red-800 font-semibold'
                                                        : result.accepted
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'border-gray-300 hover:bg-red-100 hover:shadow-md')
                                                }
                                            >
                                                {result.rejected ? '❌ Rejected' : '❌ Reject'}
                                            </button>

                                            <button
                                                disabled={result.accepted || result.rejected || result.retried}
                                                onClick={() => handleRetry(result.record_id)}
                                                className={
                                                    `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                    ((result.accepted || result.rejected || result.retried)
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'border-gray-300 hover:bg-blue-100 hover:shadow-md')
                                                }
                                            >
                                                {result.retried ? '🔁 Executing...' : '🔁 Retry'}
                                            </button>


                                            <button
                                                onClick={() => handleFeedbackOpen(result.record_id)}
                                                className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-yellow-100 hover:shadow-md transition text-sm"
                                            >
                                                💬 Feedback
                                            </button>

                                            <button
                                                onClick={() => handleEmail(result.record_id)}
                                                className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-pink-100 hover:shadow-md transition text-sm"
                                            >
                                                ✉️ Email
                                            </button>

                                            <button
                                                disabled={result.worklisted}
                                                onClick={() => handleWorklist(result.record_id)}
                                                className={
                                                    `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                    (result.worklisted
                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'border-gray-300 hover:bg-gray-100 hover:shadow-md')
                                                }
                                            >
                                                {result.worklisted ? '📋 Worklisted' : '📋 Worklist'}
                                            </button>

                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {feedbackItemId !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-96">
                        <h2 className="text-lg font-bold mb-4">Item {feedbackItemId + 1}: Your feedback will help improve future AI responses !</h2>
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Enter your feedback here..."
                            className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={handleFeedbackClose}
                                className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFeedbackClose}
                                className="px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default App;

