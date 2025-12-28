'use client';

import React from 'react';

interface TimeRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export const TimeRangeFilter = ({ value, onChange }: TimeRangeFilterProps) => {
  const ranges = ['now', '1d', '7d', '30d', '90d', '1y', 'all'];

  return (
    <div className="flex items-center justify-end mb-6">
      <div className="bg-card border border-border rounded-lg p-1 flex items-center">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              value === range
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {range === 'now' ? 'Live' : range === '1d' ? '24h' : range === 'all' ? 'All' : range}
          </button>
        ))}
      </div>
    </div>
  );
};
