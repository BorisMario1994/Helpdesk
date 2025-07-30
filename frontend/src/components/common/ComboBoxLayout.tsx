import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

type SelectLayoutProps = {
  id: string;
  options: string[];
  value?: string;
  isError?: boolean;
  onChange?: (value: string) => void;
};

export function ComboBoxLayout({ id, options, value = "", isError = false, onChange }: SelectLayoutProps) {
  const [query, setQuery] = useState("");
  
  const filteredOptions = useMemo(() => {
    return query === '' ? options : options.filter(option => 
      option.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, options]);

  const listRef = useRef<any>(null);

  const scrollToItem = useCallback((selectedValue: string) => {
    const index = filteredOptions.findIndex(option => option === selectedValue);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToItem(index, 'smart');
    }
  }, [filteredOptions]);

  const handleInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    // When user types, clear previous selection from selectedItem
    // unless the query exactly matches the previously selected item's display value
    if (value !== event.target.value) {
        onChange?.(""); 
    }
  }

  const handleInputBlur = () => {
    // If the query is empty, set selectedItem to null (clear selection)
    if (query === "") {
      onChange?.("");
    } else if (options.find(option => option.toLowerCase() === query.toLowerCase())) {
      const selectedOption = options.find(option => option.toLowerCase() === query.toLowerCase()) ?? ""
      onChange?.(selectedOption);
      setQuery(selectedOption);
    }
    // If a query exists and no option was explicitly selected, 
    // treat the query as the free text selection.
    // You might want to refine this to check if query matches any existing option exactly
    // before treating it as truly "free text".
    else if (!options.find(option => option.toLowerCase() === query.toLowerCase())) {
        onChange?.(query); // Store the raw string as the selected value
    }
    // If query matches an existing person, selectedItem would already be that person object
    // from the onChange handler on the Combobox.
  };

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <Combobox name={id} value={value} onChange={(val) => {
      onChange?.(val ?? "");
      setQuery(val ?? ""); // Reset query on selection
    }}>
      <div className="w-full h-10 text-sm">
        <ComboboxInput displayValue={() => query}
          onChange={handleInputChanged}
          onBlur={handleInputBlur}
          onFocus={() => scrollToItem(value ?? "")} className={`w-full h-10 relative px-3 pe-8 py-2 ${isError && "bg-red-100"} border border-gray-400 rounded-lg text-sm text-start data-[hover]:border-red-200 data-[hover]:shadow-md data-[hover]:shadow-red-200 data-[focus]:bg-red-100`} />
        <ComboboxButton className="w-full">
          <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-3" />
        </ComboboxButton>
        <ComboboxOptions anchor="bottom" className="w-[var(--button-width)] h-max-48 bg-white rounded-lg shadow-lg text-sm z-10 overflow-y-auto empty:invisible [--anchor-max-height:15rem]" >
          {filteredOptions.length > 0 && (
            <div className="mt-1 rounded-md shadow-lg bg-white z-10 overflow-hidden">
              <List width="100%" height={192} itemCount={filteredOptions.length} itemSize={32} ref={listRef}>
                {({ index, style }) => {
                  const option = filteredOptions[index];
                  return (
                    <ComboboxOption key={option} value={option} style={style} className="px-3 py-2 cursor-default data-[focus]:bg-red-100 data-[focus]:text-red-500 data-[focus]:font-semibold">
                      {option}
                    </ComboboxOption>
                  );
                }}
              </List>
            </div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  ); 
};
