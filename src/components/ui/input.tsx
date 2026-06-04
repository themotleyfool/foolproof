import { useEffect, useRef, useState } from 'react';

export interface ComboboxOption {
  /** Semantic value returned to the parent on selection (e.g. a channel ID). */
  value: string;
  /** Text shown in the input and in the dropdown row. */
  label: string;
  /** Optional secondary text shown right-aligned in the dropdown row (e.g. a channel ID hint). */
  hint?: string;
}

interface ComboboxInputProps {
  /**
   * Base string used to generate stable aria IDs (`{id}-listbox`, `{id}-opt-{n}`).
   * Must be unique per page.
   */
  id: string;
  /** Full unfiltered option list. The component filters this internally. */
  options: ComboboxOption[];
  /** Controlled input text value. */
  value: string;
  /** Called on every keystroke with the new raw text. */
  onChange: (text: string) => void;
  /** Called when the user commits a selection (click or Enter). */
  onSelect: (option: ComboboxOption) => void;
  /** When provided, a clear (×) button is shown inside the input while value is non-empty. */
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Non-editable prefix rendered inside the input before the text field (e.g. "#"). */
  prefix?: string;
  /** Milliseconds to debounce the filter. Default 0 (immediate). */
  debounceMs?: number;
  /** Maximum number of dropdown results. Default 8. */
  maxResults?: number;
  style?: React.CSSProperties;
}

/**
 * Accessible combobox input with a filterable dropdown.
 * Supports a non-editable prefix, debounced filtering, keyboard navigation
 * (ArrowDown/Up/Enter/Escape), and an optional clear button.
 * @param props - See {@link ComboboxInputProps}.
 */
export function ComboboxInput({
  id,
  options,
  value,
  onChange,
  onSelect,
  onClear,
  placeholder,
  disabled,
  prefix,
  debounceMs = 0,
  maxResults = 8,
  style,
}: ComboboxInputProps) {
  const [suggestions, setSuggestions] = useState<ComboboxOption[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listboxId = `${id}-listbox`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset navigation state when value changes (handles both internal typing and external resets).
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setActiveIndex(-1);
    if (!value) { setSuggestions([]); setOpen(false); }
  }

  // Scroll the highlighted option into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      (listRef.current.children[activeIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  /**
   * Runs the substring filter and updates suggestions, with optional debounce.
   * @param text - The current raw input text.
   */
  function scheduleFilter(text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const run = () => {
      const q = text.trim().toLowerCase();
      if (!q) { setSuggestions([]); setOpen(false); return; }
      const filtered = options.filter(o => o.label.toLowerCase().includes(q)).slice(0, maxResults);
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    };
    if (debounceMs > 0) {
      debounceRef.current = setTimeout(run, debounceMs);
    } else {
      run();
    }
  }

  /**
   * Handles text input changes: notifies the parent and schedules filtering.
   * @param text - The new input value.
   */
  function handleChange(text: string) {
    onChange(text);
    scheduleFilter(text);
  }

  /**
   * Commits an option selection: notifies the parent and resets dropdown state.
   * @param option - The selected option.
   */
  function handleSelect(option: ComboboxOption) {
    onSelect(option);
    setOpen(false);
    setActiveIndex(-1);
    setSuggestions([]);
  }

  /**
   * Handles keyboard navigation: ArrowDown/Up move the cursor, Enter commits,
   * Escape closes the list.
   * @param e - The keyboard event from the input.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && suggestions.length > 0) { setOpen(true); setActiveIndex(0); }
      else { setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const wrapperCls = `flex items-center p-0 w-full border rounded-[4px] bg-white transition-[border-color,box-shadow] duration-[120ms] ${
    focused
      ? 'border-primary-100 [box-shadow:0_0_0_3px_#EBEDF9]'
      : 'border-border-subtle'
  } ${disabled ? 'bg-primary-4 opacity-65 cursor-not-allowed' : 'cursor-text'}`;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <div className={wrapperCls}>
        {prefix && (
          <span className="pl-3 pr-1 text-sm font-medium text-fg-faint select-none pointer-events-none shrink-0">
            {prefix}
          </span>
        )}
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${id}-opt-${activeIndex}` : undefined}
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`flex-1 border-none outline-none bg-transparent text-sm font-medium text-fg-strong placeholder:text-fg-faint ${prefix ? 'py-[9px] pr-3 pl-0' : 'py-[9px] px-3'}`}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="border-none bg-transparent cursor-pointer px-2 text-content-36 shrink-0 leading-none flex items-center"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          ref={listRef}
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] bg-white border border-border-subtle rounded-[8px] shadow-card max-h-[260px] overflow-y-auto m-0 p-0 list-none"
        >
          {suggestions.map((option, i) => (
            <li
              key={option.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(option)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center gap-2 py-[9px] px-3 cursor-pointer text-sm font-medium text-fg-strong border-b border-b-divider last:border-b-0 ${i === activeIndex ? 'bg-primary-8' : 'bg-transparent'}`}
            >
              {prefix && <span className="text-fg-faint shrink-0">{prefix}</span>}
              <span className="flex-1">{option.label}</span>
              {option.hint && (
                <span className="text-[11px] text-fg-faint font-mono shrink-0">
                  {option.hint}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
