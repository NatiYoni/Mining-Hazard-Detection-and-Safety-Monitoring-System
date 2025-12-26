import React from 'react';

interface TimeRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  const ranges = ['1d', '7d', '30d', '90d', '1y', 'All'];

  return (
    <div className="flex justify-end mb-6">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        {ranges.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={`px-4 py-2 text-sm font-medium border ${
              value === range
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            } ${
              range === '1d' ? 'rounded-l-lg' : ''
            } ${
              range === 'All' ? 'rounded-r-lg' : ''
            }`}
          >
            {range === '1d' ? '24h' : range}
          </button>
        ))}
      </div>
    </div>
  );
}
