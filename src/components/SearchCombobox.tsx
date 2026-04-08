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
  searchPlaceholder?: string;
}

export function SearchCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Szukaj...",
}: SearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Zamknięcie listy po kliknięciu gdziekolwiek indziej na stronie
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrowanie opcji na podstawie tego, co wpisze użytkownik
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Główny przycisk inputu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 h-[48px] md:h-[50px] rounded-lg transition-all bg-white/5 border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <span className={selectedOption ? "text-white" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
      </button>

      {/* Rozwijana lista z wynikami */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-xl overflow-hidden">
          
          {/* Pole wyszukiwania "w stylu Google" */}
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              className="w-full bg-transparent text-white placeholder-gray-500 border-none focus:outline-none focus:ring-0 px-2 py-1 text-sm"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Wyniki */}
          <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                Nie znaleziono.
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value === value ? "" : option.value);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`flex items-center px-4 py-2 text-sm cursor-pointer transition-colors ${
                    value === option.value 
                      ? "bg-white/10 text-white" 
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === option.value ? "opacity-100 text-white" : "opacity-0"
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