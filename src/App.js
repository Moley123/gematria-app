import React, { useState, useEffect, useMemo } from 'react';
import { getGematria } from './utils/gematria';
import { PARSHAS } from './utils/parshas';
import { isRefInParsha } from './utils/filter';
import commonDb from './data/common_gematria.json';
import HebrewKeyboard from './utils/HebrewKeyboard';
import './App.css'; 

const App = () => {
  // --- STATE ---
  const [inputText, setInputText] = useState("");
  const [gematriaValue, setGematriaValue] = useState(0);
  
  // Search Configuration
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedParsha, setSelectedParsha] = useState("All");
  const [isColelMode, setIsColelMode] = useState(false);
  const [isSingleWordMode, setIsSingleWordMode] = useState(false);

  // Matcher/Bridge Mode State
  const [isMatcherMode, setIsMatcherMode] = useState(false);
  const [matcherTarget, setMatcherTarget] = useState("");
  const [matcherTargetValue, setMatcherTargetValue] = useState(0);
  
  // NEW: Track which input box is currently selected ('main' or 'target')
  const [activeField, setActiveField] = useState('main');

  // Data
  const [indexData, setIndexData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Tab & Pagination State
  const [activeTabValue, setActiveTabValue] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; 

  // --- EFFECTS ---

  // 1. Calculate Gematria
  useEffect(() => {
    const calc = (str) => /^\d+$/.test(str) ? parseInt(str, 10) : getGematria(str);
    setGematriaValue(calc(inputText));
  }, [inputText]);

  // 1b. Calculate Matcher Target
  useEffect(() => {
    const calc = (str) => /^\d+$/.test(str) ? parseInt(str, 10) : getGematria(str);
    setMatcherTargetValue(calc(matcherTarget));
  }, [matcherTarget]);

  // 2. Lazy Load DB
  useEffect(() => {
    if ((isSearchMode || isMatcherMode || inputText) && !indexData) {
      setIsLoadingDB(true);
      fetch('torah_index.json')
        .then(response => {
           if (!response.ok) throw new Error("Network response was not ok");
           return response.json();
        })
        .then((data) => {
          setIndexData(data);
          setIsLoadingDB(false);
        })
        .catch((err) => {
          console.error("Failed to load DB:", err);
          setIsLoadingDB(false);
        });
    }
  }, [isSearchMode, isMatcherMode, inputText, indexData]);

  // 3. Search Logic
  useEffect(() => {
    setCurrentPage(1);

    let searchValues = [];
    
    if (isMatcherMode) {
        const diff = Math.abs(matcherTargetValue - gematriaValue);
        if (diff > 0) {
            searchValues = [diff];
            setActiveTabValue(diff);
        } else {
            setSearchResults([]); 
            return;
        }
    } else {
        searchValues = isColelMode 
            ? [gematriaValue, gematriaValue - 1, gematriaValue + 1] 
            : [gematriaValue];
        setActiveTabValue(gematriaValue);
    }

    if ((!isSearchMode && !isMatcherMode) || !indexData || searchValues[0] === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      let combinedResults = [];

      searchValues.forEach(targetVal => {
        if (targetVal <= 0) return; 

        // A. FIND STANDARD MATCHES FROM DB
        const matches = indexData[String(targetVal)] || [];
        
        const filteredMatches = matches.filter(item => {
             if (isSingleWordMode) {
                 if (item.isVerse) return false;
                 if (item.phrase.includes(' ')) return false;
             }
             return true;
        });

        const matchesWithMeta = filteredMatches.map(item => ({
          ...item,
          actualValue: targetVal, 
          isExact: targetVal === (isMatcherMode ? Math.abs(matcherTargetValue - gematriaValue) : gematriaValue),
          type: 'standard'
        }));

        // B. FIND PARSHA STATS MATCHES
        const matchingParshas = PARSHAS.filter(p => p.verse_count === targetVal);
        const parshaMatches = matchingParshas.map(p => ({
            phrase: `Parshat ${p.name}`,
            ref: "Torah Stats",
            context_en: `This Parsha contains exactly ${p.verse_count} verses.`,
            actualValue: targetVal,
            isExact: true,
            type: 'stat', 
            isVerse: false
        }));

        combinedResults = [...combinedResults, ...parshaMatches, ...matchesWithMeta];
      });

      if (selectedParsha !== "All") {
        const parshaRange = PARSHAS.find(p => p.name === selectedParsha);
        if (parshaRange) {
          combinedResults = combinedResults.filter(item => 
            item.type === 'stat' || isRefInParsha(item.ref, parshaRange)
          );
        }
      }

      setSearchResults(combinedResults);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [gematriaValue, isSearchMode, isMatcherMode, matcherTargetValue, selectedParsha, indexData, isColelMode, isSingleWordMode]);

  // 4. Common Matches
  const commonMatches = useMemo(() => {
    if (gematriaValue === 0) return [];
    return commonDb[String(gematriaValue)] || [];
  }, [gematriaValue]);

  // --- PAGINATION ---
  const currentTabResults = useMemo(() => {
    return searchResults.filter(r => r.actualValue === activeTabValue);
  }, [searchResults, activeTabValue]);

  const totalPages = Math.ceil(currentTabResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentTabResults.slice(start, start + ITEMS_PER_PAGE);
  }, [currentTabResults, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleKeyboardPress = (char) => {
    // Send the character to whichever field was last clicked
    if (activeField === 'main') {
        if (char === "BACKSPACE") setInputText(prev => prev.slice(0, -1));
        else setInputText(prev => prev + char);
    } else {
        if (char === "BACKSPACE") setMatcherTarget(prev => prev.slice(0, -1));
        else setMatcherTarget(prev => prev + char);
    }
  };

  const getCountForValue = (val) => searchResults.filter(r => r.actualValue === val).length;

  // Resets everything to the initial state
  const goHome = () => {
    setInputText("");
    setMatcherTarget("");
    setIsSearchMode(false);
    setIsMatcherMode(false);
    setSearchResults([]);
    setActiveField('main');
    setSelectedParsha("All");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerSearch = (text) => {
    setInputText(text);
    setIsSearchMode(true);
    setIsMatcherMode(false);
    setActiveField('main'); // Reset focus to main
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentParshaObj = PARSHAS.find(p => p.name === selectedParsha);
  const parshaInfo = currentParshaObj && currentParshaObj.name !== "All" 
    ? `In ${currentParshaObj.name} (${currentParshaObj.verse_count} verses)`
    : "In Entire Torah";

  return (
    <div className="app-container">
      <header className="header">
        {/* Show Home Button if we are NOT on the dashboard */}
        {(inputText || matcherTarget || isMatcherMode) && (
          <button onClick={goHome} className="home-btn">
            🏠 Home
          </button>
        )}
        
        <h1 onClick={goHome} style={{ cursor: 'pointer' }}>Gematria Explorer</h1>
        <p>Calculate, Discover, and Search</p>
      </header>

      <div className="main-content">
        
        {/* MATCH MAKER MODE */}
        {isMatcherMode && (
             <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg mb-4">
                 <h2 className="text-purple-800 font-bold flex items-center gap-2">
                    💍 Wedding / Bridge Calculator
                 </h2>
                 <p className="text-sm text-purple-600 mb-4">
                     Enter the Names (Base) and your Goal (Target). We will find the words to bridge the gap.
                 </p>
                 <div className="grid md:grid-cols-2 gap-4">
                     <div>
                        <label className={`text-xs font-bold uppercase ${activeField === 'main' ? 'text-blue-600' : 'text-gray-500'}`}>
                            1. Names (Base) {activeField === 'main' && "●"}
                        </label>
                        <input 
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onFocus={() => setActiveField('main')} // Tell keyboard to type here
                            className={`w-full border p-2 rounded text-right text-lg ${activeField === 'main' ? 'ring-2 ring-blue-200 border-blue-400' : ''}`}
                            placeholder="e.g. משה חנה"
                        />
                        <div className="text-right text-sm font-bold text-gray-400 mt-1">{gematriaValue}</div>
                     </div>
                     <div>
                        <label className={`text-xs font-bold uppercase ${activeField === 'target' ? 'text-blue-600' : 'text-gray-500'}`}>
                            2. Goal (Target) {activeField === 'target' && "●"}
                        </label>
                        <input 
                            type="text"
                            value={matcherTarget}
                            onChange={(e) => setMatcherTarget(e.target.value)}
                            onFocus={() => setActiveField('target')} // Tell keyboard to type here
                            className={`w-full border p-2 rounded text-right text-lg ${activeField === 'target' ? 'ring-2 ring-blue-200 border-blue-400' : ''}`}
                            placeholder="e.g. מזל טוב"
                        />
                         <div className="text-right text-sm font-bold text-gray-400 mt-1">{matcherTargetValue}</div>
                     </div>
                 </div>
                 
                 {/* SHARED KEYBOARD */}
                 <div className="mt-2">
                    <HebrewKeyboard onKeyPress={handleKeyboardPress} />
                 </div>

                 <div className="mt-4 text-center">
                     {gematriaValue > 0 && matcherTargetValue > 0 ? (
                         <div className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                             <span className="text-gray-500">Gap to Bridge:</span>
                             <div className="text-3xl font-bold text-purple-600 my-1">
                                 {Math.abs(matcherTargetValue - gematriaValue)}
                             </div>
                         </div>
                     ) : (
                         <div className="text-gray-400 text-sm italic">Enter both fields to calculate the bridge...</div>
                     )}
                 </div>
             </div>
        )}

        {/* STANDARD MODE */}
        {!isMatcherMode && (
            <>
                <div className="input-group">
                <label>Enter Hebrew Text OR Number:</label>
                <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onFocus={() => setActiveField('main')}
                    placeholder="Type 'תורה' or '613'..."
                    dir="auto"
                    className="input-field"
                />
                {!/^\d+$/.test(inputText) && (
                    <HebrewKeyboard onKeyPress={handleKeyboardPress} />
                )}
                </div>

                <div className="value-box">
                <span className="label">Value</span>
                <div className="value-number">{gematriaValue}</div>
                </div>
            </>
        )}

        {!inputText && !matcherTarget && !isMatcherMode && (
          <div className="dashboard-grid">
            <h3 className="w-full text-lg font-bold text-gray-700 mb-2">Try a search:</h3>
            <button onClick={() => triggerSearch("613")} className="dash-card">
              <span className="icon">🔢</span>
              <div className="text"><strong>Number Search</strong><p>What words have a gematria of 613?</p></div>
            </button>
            <button onClick={() => triggerSearch("תורה")} className="dash-card">
              <span className="icon">📖</span>
              <div className="text"><strong>Word Match</strong><p>What has the same gematria as תורה?</p></div>
            </button>
            <button onClick={() => { setIsMatcherMode(true); setInputText(""); setActiveField('main'); }} className="dash-card ring-2 ring-purple-100 bg-purple-50">
              <span className="icon">💍</span>
              <div className="text text-purple-900"><strong>Wedding Matcher</strong><p>Find the "bridge word" between names and Mazel Tov!</p></div>
            </button>
          </div>
        )}

        {!isMatcherMode && inputText && commonMatches.length > 0 && (
          <div className="common-matches">
            <h3>💡 Did you know?</h3>
            <p><strong>{gematriaValue}</strong> is also:</p>
            <div className="tags">
              {commonMatches.map((match, idx) => (
                <span key={idx} className="tag">{match}</span>
              ))}
            </div>
          </div>
        )}

        <hr />

        {/* CONTROLS */}
        <div className="search-controls-wrapper">
          <div className="search-controls">
            {!isMatcherMode && (
                <label className="toggle-label">
                <input 
                    type="checkbox" 
                    checked={isSearchMode}
                    onChange={(e) => setIsSearchMode(e.target.checked)}
                />
                Search in Sefaria
                </label>
            )}

            <select 
                value={selectedParsha}
                onChange={(e) => setSelectedParsha(e.target.value)}
                className="parsha-select"
            >
                <option value="All">Entire Torah</option>
                {PARSHAS.map(p => (
                    <option key={p.name} value={p.name}>Parshat {p.name}</option>
                ))}
            </select>
          </div>
          
          {(isSearchMode || isMatcherMode) && (
             <div className="flex flex-wrap gap-2 mt-2">
                {!isMatcherMode && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isColelMode}
                            onChange={(e) => setIsColelMode(e.target.checked)}
                        />
                        <span>±1 (Colel)</span>
                        </label>
                    </div>
                )}
                
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isSingleWordMode}
                        onChange={(e) => setIsSingleWordMode(e.target.checked)}
                    />
                    <span>Single Words Only</span>
                    </label>
                </div>
             </div>
          )}
        </div>

        {/* RESULTS AREA */}
        {(isSearchMode || (isMatcherMode && gematriaValue > 0 && matcherTargetValue > 0)) && (
          <div className="results-area">
            {isLoadingDB && <div className="status">Loading Database...</div>}
            {!isLoadingDB && isSearching && <div className="status">Searching...</div>}
            
            {!isLoadingDB && !isSearching && searchResults.length >= 0 && (
              <>
                <div className="mb-4 flex items-center justify-between px-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isMatcherMode ? "Bridge Suggestions" : `Results for ${gematriaValue}`}
                    </h2>
                    <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{parshaInfo}</span>
                </div>

                {!isMatcherMode && (
                    <div className="tabs-container">
                    <button 
                        className={`tab-button ${activeTabValue === gematriaValue ? 'active' : ''}`}
                        onClick={() => { setActiveTabValue(gematriaValue); setCurrentPage(1); }}
                    >
                        Value {gematriaValue}
                        <span className="tab-count">{getCountForValue(gematriaValue)}</span>
                    </button>
                    {isColelMode && (
                        <>
                        <button 
                            className={`tab-button ${activeTabValue === gematriaValue - 1 ? 'active' : ''}`}
                            onClick={() => { setActiveTabValue(gematriaValue - 1); setCurrentPage(1); }}
                        >
                            {gematriaValue - 1}
                            <span className="tab-count">{getCountForValue(gematriaValue - 1)}</span>
                        </button>
                        <button 
                            className={`tab-button ${activeTabValue === gematriaValue + 1 ? 'active' : ''}`}
                            onClick={() => { setActiveTabValue(gematriaValue + 1); setCurrentPage(1); }}
                        >
                            {gematriaValue + 1}
                            <span className="tab-count">{getCountForValue(gematriaValue + 1)}</span>
                        </button>
                        </>
                    )}
                    </div>
                )}
                
                <div className="table-container">
                  {currentTabResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                       {isMatcherMode ? "No words found to bridge this exact gap." : "No matches found."}
                    </div>
                  ) : (
                    <>
                      <table className="results-table">
                        <thead>
                          <tr>
                            <th className="text-right">Phrase (Heb)</th>
                            <th>Reference</th>
                            <th>English Context</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedResults.map((result, idx) => (
                            <tr key={idx} className={result.isVerse ? "bg-blue-50" : result.type === 'stat' ? "bg-yellow-50" : ""}>
                              <td className={`col-phrase ${result.isVerse ? 'verse-match' : ''}`}>
                                {result.type === 'stat' ? (
                                    <div className="flex flex-col items-end text-yellow-800">
                                        <span className="stat-label">STRUCTURE MATCH</span>
                                        {result.phrase}
                                    </div>
                                ) : result.isVerse ? (
                                  <div className="flex flex-col items-end">
                                    <span className="verse-label">WHOLE VERSE</span>
                                    <span className="block mt-1">{result.original_he}</span>
                                  </div>
                                ) : (
                                  result.phrase
                                )}
                              </td>
                              <td className="col-ref">
                                {result.type === 'stat' ? (
                                    <span className="font-bold text-yellow-700">Torah Stats</span>
                                ) : (
                                    <a href={`https://www.sefaria.org/${result.ref}`} target="_blank" rel="noreferrer">
                                    {result.ref}
                                    </a>
                                )}
                              </td>
                              <td className="col-context">
                                {result.type === 'stat' && <span className="text-2xl mr-2">📊</span>}
                                {result.context_en}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {totalPages > 1 && (
                        <div className="pagination-controls">
                          <button className="page-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
                          <span className="page-info">Page {currentPage} of {totalPages}</span>
                          <button className="page-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;