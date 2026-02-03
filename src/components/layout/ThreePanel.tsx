'use client';

interface ThreePanelProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function ThreePanel({ left, center, right }: ThreePanelProps) {
  return (
    <div className="flex h-screen">
      <div className="w-[280px] border-r border-gray-200 overflow-y-auto bg-gray-50">
        {left}
      </div>
      <div className="flex-1 overflow-y-auto">
        {center}
      </div>
      <div className="w-[320px] border-l border-gray-200 overflow-y-auto bg-gray-50">
        {right}
      </div>
    </div>
  );
}
