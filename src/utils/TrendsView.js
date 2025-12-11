import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import HebrewKeyboard from './HebrewKeyboard';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];
const BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"];
const HEBREW_BOOKS = {
    "Genesis": "Bereshit",
    "Exodus": "Shemot",
    "Leviticus": "Vayikra",
    "Numbers": "Bamidbar",
    "Deuteronomy": "Devarim"
};

// STRICT PREFIXES
const VALID_PREFIXES = [
  "ו", "ב", "כ", "ל", "מ",
  "וב", "וכ", "ול", "ומ",
  "ש"
];

const TrendsView = () => {
  const [torahText, setTorahText] = useState(null);
  const [inputs, setInputs] = useState(['']); 
  const [chartData, setChartData] = useState([]);
  const [tableData, setTableData] = useState([]); 
  const [activeInputIndex, setActiveInputIndex] = useState(0);
  const [usePrefixes, setUsePrefixes] = useState(true); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
      setIsLoading(true);
      fetch(`${process.env.PUBLIC_URL}/torah_text.json?v=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
            setTorahText(data);
            setIsLoading(false);
        })
        .catch(err => {
            console.error("Missing torah_text.json", err);
            setIsLoading(false);
        });
  }, []);

  useEffect(() => {
    if (!torahText || inputs.length === 0 || !inputs[0]) {
        if (!inputs[0]) {
            setChartData([]);
            setTableData([]);
        }
        return;
    }

    const SAMPLE_RATE = 50; 
    let dataPoints = [];
    let allMatches = []; 
    
    // Init Buckets
    for (let i = 0; i < torahText.length; i += SAMPLE_RATE) {
      dataPoints.push({ 
        index: i, 
        name: torahText[i].r, 
        book: torahText[i].b 
      });
    }

    // FIX: Add Final Bucket to catch the last few verses (Deut 33-34)
    if (dataPoints.length > 0 && dataPoints[dataPoints.length - 1].index < torahText.length - 1) {
        dataPoints.push({
            index: torahText.length - 1,
            name: torahText[torahText.length - 1].r,
            book: torahText[torahText.length - 1].b
        });
    }

    // Process inputs
    inputs.forEach((word) => {
       if (!word) return;

       let count = 0;
       let verseIdx = 0;

       dataPoints = dataPoints.map(pt => {
          // Process all verses up to this bucket's index
          while (verseIdx < torahText.length && verseIdx <= pt.index) {
             const verseObj = torahText[verseIdx];
             const verseText = verseObj.t; 
             const wordsInVerse = verseText.split(" ");
             
             let verseMatchFound = false;
             let matchesInVerse = 0;

             for (let w of wordsInVerse) {
                 let isMatch = false;
                 if (w === word) {
                     isMatch = true;
                 } else if (usePrefixes && w.endsWith(word)) {
                     const prefix = w.substring(0, w.length - word.length);
                     if (VALID_PREFIXES.includes(prefix)) {
                         isMatch = true;
                     }
                 }
                 if (isMatch) {
                     count++;
                     matchesInVerse++;
                     verseMatchFound = true;
                 }
             }

             if (verseMatchFound) {
                 allMatches.push({
                     ref: verseObj.r,
                     book: verseObj.b,
                     text: verseObj.o || verseObj.t, 
                     word: word, 
                     count: matchesInVerse,
                     index: verseObj.i
                 });
             }
             verseIdx++;
          }
          return { ...pt, [word]: count };
       });
    });

    setChartData(dataPoints);
    setTableData(allMatches.sort((a, b) => a.index - b.index));
    setCurrentPage(1); 
  }, [inputs, torahText, usePrefixes]);

  const getStats = () => {
      const stats = {};
      BOOKS.forEach(b => stats[b] = 0);
      tableData.forEach(row => {
          if (stats[row.book] !== undefined) {
              stats[row.book] += row.count; 
          }
      });
      return stats;
  };
  const stats = getStats();
  const totalCount = Object.values(stats).reduce((a,b) => a + b, 0);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedData = tableData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const downloadCSV = () => {
      const headers = ["Reference", "Book", "Word Found", "Occurrences in Verse", "Text"];
      const rows = tableData.map(r => [
          r.ref, 
          r.book, 
          r.word, 
          r.count, 
          `"${r.text.replace(/"/g, '""')}"` 
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
          + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `gematria_export_${inputs[0] || "results"}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleInputChange = (idx, val) => {
    const newInputs = [...inputs];
    newInputs[idx] = val;
    setInputs(newInputs);
    setActiveInputIndex(idx);
  };

  const handleKeyboardPress = (char) => {
    const newInputs = [...inputs];
    const currentVal = newInputs[activeInputIndex] || "";
    if (char === "BACKSPACE") {
        newInputs[activeInputIndex] = currentVal.slice(0, -1);
    } else {
        newInputs[activeInputIndex] = currentVal + char;
    }
    setInputs(newInputs);
  };

  const addInput = () => { setInputs([...inputs, '']); setActiveInputIndex(inputs.length); };
  const removeInput = (idx) => { setInputs(inputs.filter((_, i) => i !== idx)); setActiveInputIndex(0); };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Text Data...</div>;
  if (!torahText) return <div className="p-8 text-center text-red-500">Error: <code>torah_text.json</code> missing.</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <style>{`
        .grid-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        .grid-table th, .grid-table td { border: 1px solid #cbd5e1; padding: 8px 12px; }
        .grid-table th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
        .grid-table tr:hover td { background-color: #f8fafc; }
      `}</style>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📈 Trend Tracker
      </h2>
      
      <div className="flex items-center gap-2 mb-4 text-sm bg-gray-50 p-2 rounded w-fit border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={usePrefixes} onChange={(e) => setUsePrefixes(e.target.checked)} />
              <span>Include Prefixes (e.g. <strong>U'</strong>Moshe)</span>
          </label>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        {inputs.map((inp, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input 
              type="text" value={inp} 
              onChange={(e) => handleInputChange(idx, e.target.value)}
              onFocus={() => setActiveInputIndex(idx)}
              placeholder="Hebrew..."
              className={`border p-2 rounded text-right w-32 ${activeInputIndex === idx ? 'ring-2 ring-blue-200 border-blue-400' : ''}`}
              dir="rtl"
            />
            {idx > 0 && <button onClick={() => removeInput(idx)} className="text-red-400 font-bold">×</button>}
          </div>
        ))}
        <button onClick={addInput} className="text-blue-600 text-sm font-semibold hover:underline">+ Compare Another</button>
      </div>

      <div className="chart-keyboard-gap">
          <HebrewKeyboard onKeyPress={handleKeyboardPress} />
      </div>

      <div style={{ width: '100%', height: 400 }} className="relative mb-8">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={false} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, `${name} matches`]} labelFormatter={(label) => `Ref: ${label}`} />
            <Legend />
            {inputs.map((word, idx) => (
              word && <Line key={idx} type="monotone" dataKey={word} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {tableData.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-sm">
                  <h3 className="text-blue-800 font-bold mb-4 text-lg border-b border-gray-300 pb-2">📊 Breakdown by Book</h3>
                  <div className="flex justify-between items-center mb-4 bg-blue-50 p-3 rounded border border-blue-200">
                      <span className="font-bold text-blue-900">Total Appearances:</span>
                      <span className="font-bold text-blue-700 text-2xl">{totalCount}</span>
                  </div>
                  
                  <table className="grid-table">
                      <thead>
                          <tr>
                              <th style={{textAlign: 'left'}}>Book</th>
                              <th style={{textAlign: 'right'}}>Count</th>
                          </tr>
                      </thead>
                      <tbody>
                          {BOOKS.map(book => (
                              <tr key={book}>
                                  <td>{HEBREW_BOOKS[book]}</td>
                                  <td style={{textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold'}}>
                                      {stats[book]}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {tableData.length > 0 && (
          <div className="border-t border-gray-300 pt-8">
              <div className="flex justify-between items-end mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                      Found {tableData.length} Verses
                  </h3>
                  <button 
                    onClick={downloadCSV}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded shadow flex items-center gap-2 border border-green-800"
                  >
                      📥 Download CSV
                  </button>
              </div>

              <div className="border border-gray-400 rounded overflow-hidden">
                  <table className="grid-table">
                      <thead>
                          <tr>
                              <th className="w-40 text-center">Reference</th>
                              <th className="text-center">Text</th>
                          </tr>
                      </thead>
                      <tbody>
                          {paginatedData.map((row, i) => (
                              <tr key={i}>
                                  <td className="whitespace-nowrap align-top ltr font-bold text-center text-gray-600">
                                      {row.ref}
                                  </td>
                                  <td className="text-xl font-serif leading-relaxed text-gray-900 text-right" dir="rtl">
                                      {row.text}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm"
                      >
                          ← Previous
                      </button>
                      <span className="text-sm text-gray-600 font-medium">
                          Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm"
                      >
                          Next →
                      </button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default TrendsView;