'use client';

interface ThreePanelProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function ThreePanel({ left, center, right }: ThreePanelProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel - White background */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {left}
      </div>
      {/* Center Panel - Gray background */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {center}
      </div>
      {/* Right Panel - White background */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
        {right}
      </div>
    </div>
  );
}
