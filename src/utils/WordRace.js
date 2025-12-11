import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import raceData from '../data/race_data.json';

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#e0f2fe', '#f0f9ff', '#d1fae5', '#a7f3d0', '#6ee7b7'];

const WordRace = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usePrefixes, setUsePrefixes] = useState(true); // Default: Include prefixes
  const timerRef = useRef(null);

  // ANIMATION LOOP
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setFrameIndex((prev) => {
          if (prev >= raceData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100); 
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  const currentFrame = raceData[frameIndex];
  
  // Decide which data key to sort and display
  const dataKey = usePrefixes ? "prefix" : "exact";
  
  // Re-sort data based on the toggle (since JSON is sorted by prefix default)
  const displayData = [...currentFrame.data]
      .sort((a, b) => b[dataKey] - a[dataKey])
      .slice(0, 10); // Top 10

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
           🏆 Torah Word Race
        </h2>
        <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded">
            {currentFrame.label}
        </div>
      </div>

      {/* TOGGLE */}
      <div className="flex items-center gap-2 mb-4 text-sm bg-gray-50 p-2 rounded w-fit">
          <label className="flex items-center gap-2 cursor-pointer">
              <input 
                  type="checkbox"
                  checked={usePrefixes}
                  onChange={(e) => setUsePrefixes(e.target.checked)}
              />
              <span>Include Prefixes (e.g. <strong>U'</strong>Moshe)</span>
          </label>
      </div>

      {/* CHART AREA */}
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={displayData}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            animationDuration={300} 
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 14, fontWeight: 'bold' }}
            />
            <Tooltip 
                cursor={{fill: 'transparent'}} 
                formatter={(value) => [value, usePrefixes ? "Occurrences (w/ Prefix)" : "Exact Matches"]}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={20}>
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CONTROLS */}
      <div className="mt-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
        <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-6 py-2 rounded-full font-bold text-white transition ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
        >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <input 
            type="range" 
            min="0" 
            max={raceData.length - 1} 
            value={frameIndex}
            onChange={(e) => {
                setIsPlaying(false);
                setFrameIndex(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
};

export default WordRace;