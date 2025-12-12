import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import raceData from '../data/race_data.json';

const COLORS = [
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', 
  '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca',
  '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
  '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'
];

const WordRace = () => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [usePrefixes, setUsePrefixes] = useState(true); 
  const timerRef = useRef(null);

  const ANIMATION_SPEED_MS = 250; 

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
      }, ANIMATION_SPEED_MS); 
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  const currentFrame = raceData[frameIndex];
  const dataKey = usePrefixes ? "prefix" : "exact";
  
  // Sort and Slice
  const displayData = [...currentFrame.data]
      .sort((a, b) => b[dataKey] - a[dataKey])
      .slice(0, 20);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
           🏆 Torah Word Race (Top 20)
        </h2>
        <div className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded">
            {currentFrame.label}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-sm bg-gray-50 p-2 rounded w-fit border border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
              <input 
                  type="checkbox"
                  checked={usePrefixes}
                  onChange={(e) => setUsePrefixes(e.target.checked)}
              />
              <span>Include Prefixes (e.g. <strong>U'</strong>Moshe)</span>
          </label>
      </div>

      <div style={{ width: '100%', height: 650 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={displayData}
            margin={{ top: 5, right: 30, left: 60, bottom: 20 }} // Added bottom margin for axis labels
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            
            {/* UPDATED X-AXIS (Now Visible) */}
            <XAxis 
                type="number" 
                domain={[0, 'auto']} 
                tick={{ fontSize: 12, fill: '#6b7280' }}
            />

            <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 13, fontWeight: 'bold' }}
                interval={0}
                isAnimationActive={false}
            />
            <Tooltip 
                cursor={{fill: 'transparent'}} 
                formatter={(value) => [value, usePrefixes ? "Occurrences (w/ Prefix)" : "Exact Matches"]}
            />
            <Bar 
                dataKey={dataKey} 
                radius={[0, 4, 4, 0]} 
                barSize={18}
                animationDuration={ANIMATION_SPEED_MS}
                animationEasing="linear"
            >
              {displayData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
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