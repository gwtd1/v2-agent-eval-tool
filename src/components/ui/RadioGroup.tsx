'use client';

import { clsx } from 'clsx';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  size?: 'sm' | 'lg';
  className?: string;
}

// Thumbs Up Icon
function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
    </svg>
  );
}

// Thumbs Down Icon
function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
    </svg>
  );
}

export function RadioGroup(props: RadioGroupProps) {
  const { options, value, onChange, size = 'lg', className } = props;
  return (
    <div className={clsx('flex gap-3', className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = value === option.value;
        const isPass = option.value === 'pass';
        const isFail = option.value === 'fail';

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded-lg border-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center',
              {
                // Size variants
                'py-2 px-3 text-sm': size === 'sm',
                'py-3 px-4 text-base': size === 'lg',
                // Pass button styles (green)
                'border-green-500 bg-green-50 text-green-700 focus:ring-green-500':
                  isPass && isSelected,
                'border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 focus:ring-green-500':
                  isPass && !isSelected,
                // Fail button styles (red)
                'border-red-500 bg-red-50 text-red-700 focus:ring-red-500':
                  isFail && isSelected,
                'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 focus:ring-red-500':
                  isFail && !isSelected,
                // Default styles for other values
                'border-blue-500 bg-blue-50 text-blue-700 focus:ring-blue-500':
                  !isPass && !isFail && isSelected,
                'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:ring-blue-500':
                  !isPass && !isFail && !isSelected,
              }
            )}
          >
            {isPass && <ThumbsUpIcon className="w-5 h-5 mr-2" />}
            {isFail && <ThumbsDownIcon className="w-5 h-5 mr-2" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
