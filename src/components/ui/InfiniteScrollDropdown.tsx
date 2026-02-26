'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface DropdownItem {
  id: string;
  name: string;
  displayName?: string;
}

export interface InfiniteScrollDropdownProps {
  items: DropdownItem[];
  onItemSelect: (item: DropdownItem | null) => void;
  onLoadMore: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  selectedItem: DropdownItem | null;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  totalCount?: number;
}

export function InfiniteScrollDropdown({
  items,
  onItemSelect,
  onLoadMore,
  isLoading,
  isLoadingMore,
  hasMore,
  selectedItem,
  placeholder = 'Select item',
  disabled = false,
  label,
  className = '',
  totalCount
}: InfiniteScrollDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // Load more when scrolled to 80% of the content
    if (scrollTop + clientHeight >= scrollHeight * 0.8 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleItemClick = (item: DropdownItem) => {
    onItemSelect(item);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleDropdownToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && filteredItems.length === 0 && !isLoading) {
        onLoadMore();
      }
    }
  };

  const displayText = selectedItem?.displayName || selectedItem?.name || placeholder;
  const showingCount = filteredItems.length;
  const loadedCount = items.length;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Dropdown Trigger */}
        <div
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm bg-white cursor-pointer transition-all duration-200 ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20'
              : 'hover:border-gray-400'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          onClick={handleDropdownToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleDropdownToggle();
            }
          }}
        >
          <span className={selectedItem ? 'text-gray-900' : 'text-gray-500'}>
            {displayText}
          </span>
          <span
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Items Count Info */}
            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 text-center">
              {searchTerm ? (
                `Found ${showingCount} matches`
              ) : (
                `Showing ${loadedCount}${totalCount ? ` of ${totalCount}` : ''} projects`
              )}
            </div>

            {/* Items List */}
            <div
              ref={menuRef}
              className="max-h-60 overflow-y-auto"
              onScroll={handleScroll}
            >
              {isLoading && filteredItems.length === 0 ? (
                <div className="px-3 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Loading projects...</span>
                  </div>
                </div>
              ) : (
                <>
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    const displayName = item.displayName || item.name;

                    return (
                      <div
                        key={item.id}
                        className={`px-3 py-2 cursor-pointer transition-colors duration-150 hover:bg-blue-50 ${
                          isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                        }`}
                        onClick={() => handleItemClick(item)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="block truncate">
                          {displayName.length > 50 ? displayName.substring(0, 47) + '...' : displayName}
                        </span>
                      </div>
                    );
                  })}

                  {/* Loading More Indicator */}
                  {isLoadingMore && (
                    <div className="px-3 py-4 text-center text-gray-500 border-t border-gray-100">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Loading more projects...</span>
                      </div>
                    </div>
                  )}

                  {/* End of Results */}
                  {!hasMore && filteredItems.length > 0 && !searchTerm && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                      All projects loaded
                    </div>
                  )}

                  {/* No Results */}
                  {filteredItems.length === 0 && !isLoading && searchTerm && (
                    <div className="px-3 py-4 text-center text-gray-500">
                      <span className="text-sm">No projects found for "{searchTerm}"</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}