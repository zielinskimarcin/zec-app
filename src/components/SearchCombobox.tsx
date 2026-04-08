import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

// ŚCIEŻKI WZGLĘDNE - ZERO ALIASÓW
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

interface Option {
  value: string
  label: string
}

interface SearchComboboxProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
}

export function SearchCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Szukaj...",
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full px-4 py-6 justify-between rounded-lg transition-all font-normal bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-white/20 focus:border-white/20"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : <span className="text-gray-500">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 bg-[#0f0f0f] border border-white/10 rounded-lg shadow-xl" 
        align="start"
      >
        <Command className="bg-transparent text-white">
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="text-white placeholder:text-gray-500 border-none focus:ring-0" 
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-sm text-gray-500">
              Nie znaleziono.
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                  className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10 aria-selected:bg-white/10 aria-selected:text-white"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100 text-white" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}