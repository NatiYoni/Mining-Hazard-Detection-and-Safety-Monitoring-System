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
            className={`px-4 py-2 text-sm font-medium border transition-colors ${
              value === range
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-foreground border-border hover:bg-muted'
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
