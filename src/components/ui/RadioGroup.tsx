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

export function RadioGroup(props: RadioGroupProps) {
  const { options, value, onChange, size = 'lg', className } = props;
  return (
    <div className={clsx('flex gap-3', className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = value === option.value;
        const isTrue = option.value === 'true';
        const isFalse = option.value === 'false';

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded-lg border-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              {
                // Size variants
                'py-2 px-3 text-sm': size === 'sm',
                'py-3 px-4 text-base': size === 'lg',
                // True button styles
                'border-green-500 bg-green-50 text-green-700 focus:ring-green-500':
                  isTrue && isSelected,
                'border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50 focus:ring-green-500':
                  isTrue && !isSelected,
                // False button styles
                'border-red-500 bg-red-50 text-red-700 focus:ring-red-500':
                  isFalse && isSelected,
                'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50 focus:ring-red-500':
                  isFalse && !isSelected,
                // Default styles for other values
                'border-blue-500 bg-blue-50 text-blue-700 focus:ring-blue-500':
                  !isTrue && !isFalse && isSelected,
                'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 focus:ring-blue-500':
                  !isTrue && !isFalse && !isSelected,
              }
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
