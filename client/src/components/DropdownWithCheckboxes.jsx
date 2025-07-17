import React, { useState, useEffect, useRef } from 'react';

const DropdownWithCheckboxes = ({
  buttonLabel = 'Select Fields',
  options = [],
  selected = [],
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState(selected);

  const dropdownRef = useRef();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (value) => {
    let updated = [...selectedOptions];
    if (updated.includes(value)) {
      updated = updated.filter((v) => v !== value);
    } else {
      updated.push(value);
    }
    setSelectedOptions(updated);
    if (onChange) onChange(updated);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="inline-flex items-center justify-center border font-sans font-medium text-center duration-300 ease-in disabled:opacity-50 disabled:cursor-not-allowed focus:shadow-none text-sm py-2 px-4 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 text-stone-50 rounded-lg"
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="absolute mt-2 bg-white border border-stone-200 rounded-lg shadow-sm p-2 z-10 w-64 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <div key={option.value} className="flex items-center py-1 px-2 hover:bg-stone-100 rounded">
              <label className="flex items-center w-full cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 cursor-pointer rounded border border-stone-300 checked:bg-stone-800 checked:border-stone-800"
                  checked={selectedOptions.includes(option.value)}
                  onChange={() => handleCheckboxChange(option.value)}
                />
                <span className="text-stone-800 text-sm break-words">
                  {option.label}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownWithCheckboxes;
