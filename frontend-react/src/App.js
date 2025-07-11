import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import RunControls from './components/RunControls';
function App() {
    const [records, setRecords] = useState([]);
    const [results, setResults] = useState([]);
    const [keySource, setKeySource] = useState('');
    const [summary, setSummary] = useState({ ok: 0, error: 0 });
    const [loading, setLoading] = useState(false);
    const [fileError, setFileError] = useState('');
    const [feedbackItemId, setFeedbackItemId] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [advancedTemp, setAdvancedTemp] = useState(false);
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
        }
        catch (err) {
            setFileError('Failed to load demo example.');
        }
    };
    const runValidation = async (useRag) => {
        setLoading(true);
        try {
            const endpoint = 'http://localhost:8000/validate';
            const response = await axios.post(endpoint, {
                records,
                use_rag: useRag,
                temperature: temperature
            });
            const resData = response.data;
            const resultsWithMarked = resData.results.map((r) => ({
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
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const toggleMarked = (recordId) => {
        setResults((prevResults) => prevResults.map((r) => r.record_id === recordId ? { ...r, marked: !r.marked } : r));
    };
    const handleAccept = (recordId) => {
        setResults(prev => prev.map(r => r.record_id === recordId ? { ...r, accepted: !r.accepted } : r));
    };
    const handleReject = (recordId) => {
        setResults(prev => prev.map(r => r.record_id === recordId ? { ...r, rejected: !r.rejected } : r));
    };
    const handleRetry = async (recordId) => {
        const index = results.findIndex(r => r.record_id === recordId);
        const recordToRetry = records[index];
        if (!recordToRetry)
            return;
        // Show “Executing…” state
        setResults(prev => prev.map(r => r.record_id === recordId ? { ...r, retried: true } : r));
        try {
            const endpoint = 'http://localhost:8000/validate';
            const response = await axios.post(endpoint, {
                records: [recordToRetry],
                use_rag: false
            });
            const retried = response.data.results[0];
            // ⬇️ Update results with the retried record
            const updatedResults = results.map((r, idx) => r.record_id === recordId
                ? {
                    ...retried,
                    accepted: r.accepted,
                    rejected: r.rejected,
                    marked: r.marked,
                    retried: false
                }
                : r);
            // ⬇️ Recalculate summary (OK count, error count, avgScore)
            const okCount = updatedResults.filter(r => r.status === 'OK').length;
            const scored = updatedResults.filter(r => r.score !== null && r.score !== undefined);
            const avgScore = scored.length > 0
                ? (scored.reduce((sum, r) => sum + r.score, 0) / scored.length).toFixed(1)
                : null;
            setResults(updatedResults);
            setSummary({ ok: okCount, error: updatedResults.length - okCount, avgScore });
        }
        catch (err) {
            console.error('Retry failed:', err);
            setResults(prev => prev.map(r => r.record_id === recordId ? { ...r, retried: false } : r));
        }
    };
    const handleFeedbackOpen = (recordId) => {
        setFeedbackItemId(recordId);
        setFeedbackText('');
    };
    const handleFeedbackClose = () => {
        setFeedbackItemId(null);
        setFeedbackText('');
    };
    const handleEmail = (recordId) => {
        const result = results.find(r => r.record_id === recordId);
        if (!result)
            return;
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
    const handleWorklist = (recordId) => {
        setResults(prev => prev.map(r => r.record_id === recordId ? { ...r, worklisted: true } : r));
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8", children: [_jsx("div", { className: "max-w-4xl mx-auto px-4", children: _jsxs("div", { className: "bg-white p-8 shadow-xl rounded-lg", children: [_jsx(Header, {}), _jsx(UploadSection, { handleFileChange: handleFileChange, loadDemoFile: loadDemoFile }), fileError && _jsx("p", { className: "text-red-500 mb-2", children: fileError }), _jsx(RunControls, { records: records, runValidation: runValidation, temperature: temperature, setTemperature: setTemperature, advancedTemp: advancedTemp, setAdvancedTemp: setAdvancedTemp }), loading && (_jsxs("div", { className: "flex flex-col items-center mt-4 text-gray-700", children: [_jsx(ClipLoader, { size: 24, color: "#2563EB" }), _jsx("span", { className: "mt-2", children: "Validating..." })] })), !loading && results.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsxs("p", { className: "text-gray-800 mb-2", children: ["API Used: ", keySource] }), _jsxs("div", { className: "mb-4 space-y-1", children: [_jsx("hr", { className: "my-4 border-t border-gray-300" }), _jsx("p", { className: "font-semibold", children: "Summary:" }), summary.ok > 0 && (_jsxs("p", { className: "text-green-600 font-bold", children: ["\u2705 ", summary.ok, " OK"] })), summary.error > 0 && (_jsxs("p", { className: "text-red-600 font-bold", children: ["\u274C ", summary.error, " ", summary.error === 1 ? 'Error' : 'Errors'] })), summary.avgScore && (_jsxs("p", { className: "text-gray-600 font-medium", children: [parseFloat(summary.avgScore) >= 8 ? '✅' :
                                                    parseFloat(summary.avgScore) >= 5 ? '⚠️' :
                                                        '❌', " Avg Score: ", summary.avgScore, "/10"] }))] }), _jsx("hr", { className: "mb-4" }), results.map((result, idx) => (_jsxs("div", { className: "bg-white shadow-md rounded-xl p-4 my-4 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "font-semibold text-lg", children: ["Item ", idx + 1, ":"] }), _jsx("button", { onClick: () => toggleMarked(result.record_id), className: "transition transform hover:scale-110", title: result.marked ? "Unmark" : "Mark for Review", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: result.marked ? "red" : "transparent", viewBox: "0 0 24 24", stroke: "red", className: "w-6 h-6", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.683a1 1 0 00.95.69h3.862c.969 0 1.371 1.24.588 1.81l-3.124 2.27a1 1 0 00-.364 1.118l1.2 3.683c.3.921-.755 1.688-1.538 1.118l-3.124-2.27a1 1 0 00-1.176 0l-3.124 2.27c-.783.57-1.838-.197-1.538-1.118l1.2-3.683a1 1 0 00-.364-1.118L2.449 9.11c-.783-.57-.38-1.81.588-1.81h3.862a1 1 0 00.95-.69l1.2-3.683z" }) }) })] }), _jsxs("div", { className: "text-sm text-gray-600 mt-1 flex gap-4 items-center flex-wrap", children: [_jsxs("span", { children: [_jsx("span", { className: "font-semibold", children: "Status:" }), _jsx("span", { className: `ml-1 font-bold ${result.status === 'OK' ? 'text-green-600' : 'text-red-600'}`, children: result.status })] }), result.score !== undefined && result.score !== null && (_jsxs("span", { children: [_jsx("span", { className: "font-semibold", children: "Score:" }), _jsxs("span", { className: "ml-1", children: [Number.isInteger(result.score) ? result.score : result.score.toFixed(1), "/10"] })] }))] }), _jsx("p", { className: "mt-2 text-gray-700", children: result.llm_reasoning }), _jsx("div", { className: "flex justify-start items-center gap-2 text-sm text-gray-700 border-t pt-2 mt-4 border-gray-200", children: _jsxs("div", { className: "flex flex-wrap gap-2 mt-3", children: [_jsx("button", { disabled: result.rejected, onClick: () => handleAccept(result.record_id), className: `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                            (result.accepted
                                                                ? 'bg-gray-200 text-gray-500'
                                                                : result.rejected
                                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : 'border-gray-300 hover:bg-green-100 hover:shadow-md'), children: result.accepted ? '✅ Accepted' : '✅ Accept' }), _jsx("button", { disabled: result.accepted, onClick: () => handleReject(result.record_id), className: `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                            (result.rejected
                                                                ? 'bg-red-200 text-red-800 font-semibold'
                                                                : result.accepted
                                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : 'border-gray-300 hover:bg-red-100 hover:shadow-md'), children: result.rejected ? '❌ Rejected' : '❌ Reject' }), _jsx("button", { disabled: result.accepted || result.rejected || result.retried, onClick: () => handleRetry(result.record_id), className: `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                            ((result.accepted || result.rejected || result.retried)
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'border-gray-300 hover:bg-blue-100 hover:shadow-md'), children: result.retried ? '🔁 Executing...' : '🔁 Retry' }), _jsx("button", { onClick: () => handleFeedbackOpen(result.record_id), className: "flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-yellow-100 hover:shadow-md transition text-sm", children: "\uD83D\uDCAC Feedback" }), _jsx("button", { onClick: () => handleEmail(result.record_id), className: "flex items-center gap-1 px-2 py-1 border border-gray-300 rounded-lg shadow hover:bg-pink-100 hover:shadow-md transition text-sm", children: "\u2709\uFE0F Email" }), _jsx("button", { disabled: result.worklisted, onClick: () => handleWorklist(result.record_id), className: `flex items-center gap-1 px-2 py-1 border rounded-lg shadow transition text-sm ` +
                                                            (result.worklisted
                                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                : 'border-gray-300 hover:bg-gray-100 hover:shadow-md'), children: result.worklisted ? '📋 Worklisted' : '📋 Worklist' })] }) })] }, idx)))] }))] }) }), feedbackItemId !== null && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-xl shadow-xl w-96", children: [_jsxs("h2", { className: "text-lg font-bold mb-4", children: ["Item ", feedbackItemId + 1, ": Your feedback will help improve future AI responses !"] }), _jsx("textarea", { value: feedbackText, onChange: (e) => setFeedbackText(e.target.value), placeholder: "Enter your feedback here...", className: "w-full border border-gray-300 rounded-md p-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" }), _jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [_jsx("button", { onClick: handleFeedbackClose, className: "px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md", children: "Cancel" }), _jsx("button", { onClick: handleFeedbackClose, className: "px-4 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md", children: "Send" })] })] }) }))] }));
}
export default App;
