import React from 'react';

const HEBREW_LETTERS = [
  'ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ',
  'ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף',
  'ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ'
];

const HebrewKeyboard = ({ onKeyPress }) => {
  return (
    <div className="grid grid-cols-8 gap-1 mt-2 p-2 bg-gray-100 rounded border border-gray-300">
      {HEBREW_LETTERS.map((char) => (
        <button
          key={char}
          onClick={() => onKeyPress(char)}
          className="bg-white hover:bg-blue-50 text-xl font-bold p-2 rounded shadow-sm border border-gray-200 active:bg-blue-200 transition"
          type="button" // Important: Prevents form submission
        >
          {char}
        </button>
      ))}
      
      {/* Backspace Button */}
      <button
        onClick={() => onKeyPress("BACKSPACE")}
        className="col-span-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold p-2 rounded shadow-sm border border-red-200"
        type="button"
      >
        ⌫ Del
      </button>

      {/* Space Button */}
      <button
        onClick={() => onKeyPress(" ")}
        className="col-span-3 bg-white hover:bg-gray-50 font-bold p-2 rounded shadow-sm border border-gray-200"
        type="button"
      >
        Space
      </button>
    </div>
  );
};

export default HebrewKeyboard;