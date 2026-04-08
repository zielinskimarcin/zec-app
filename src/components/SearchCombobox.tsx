import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchCombobox({
  options,
  value,
  onChange,
  placeholder,
}: SearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Synchronizacja tekstu w inpucie, gdy zmieni się wartość wybrana (value)
  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    if (selected) {
      setInputValue(selected.label);
    } else if (value === "") {
      setInputValue("");
    }
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-3 h-[48px] md:h-[50px] rounded-lg transition-all bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            // Jeśli użytkownik ręcznie skasuje wszystko, czyścimy wybór w rodzicu
            if (e.target.value === "") onChange("");
          }}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronsUpDown className="h-4 w-4 text-gray-500" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
          <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                Brak wyników.
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setInputValue(option.label);
                    setIsOpen(false);
                  }}
                  className={`flex items-center px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    value === option.value 
                      ? "bg-white/10 text-white" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 shrink-0 ${
                      value === option.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}