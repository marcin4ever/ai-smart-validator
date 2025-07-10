import React from 'react';

interface RunButtonsProps {
    records: any[];
    runValidation: (useRAG: boolean) => void;
}

const RunButtons: React.FC<RunButtonsProps> = ({ records, runValidation }) => {
    if (records.length === 0) return null;

    return (
        <>
            <p className="text-green-600 mb-2">Loaded {records.length} records.</p>
            <div className="flex gap-4 mb-4 max-w-[480px] mx-auto">
                <button
                    onClick={() => runValidation(false)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
                >
                    Run Validation
                </button>

                <button
                    onClick={() => runValidation(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition duration-200 shadow-md"
                >
                    Run with RAG WM Rules
                </button>
            </div>
        </>
    );
};

export default RunButtons;
