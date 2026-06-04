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

  // Reset active index on each new query so navigation starts fresh
  useEffect(() => { setActiveIndex(-1); }, [value]);

  // Clear suggestions when the parent resets the input externally
  useEffect(() => {
    if (!value) { setSuggestions([]); setOpen(false); }
  }, [value]);

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
    debounceMs > 0 ? (debounceRef.current = setTimeout(run, debounceMs)) : run();
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

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <div
        className="input"
        style={{
          display: 'flex', alignItems: 'center', padding: 0,
          cursor: disabled ? 'not-allowed' : 'text',
          ...(focused ? { borderColor: 'var(--mf-primary-100)', boxShadow: '0 0 0 3px var(--mf-primary-8)' } : {}),
          ...(disabled ? { background: 'var(--mf-primary-4)', opacity: 0.65 } : {}),
        }}
      >
        {prefix && (
          <span style={{
            padding: '0 4px 0 12px', color: 'var(--fg-faint)',
            fontSize: 14, fontWeight: 500, userSelect: 'none', pointerEvents: 'none', flexShrink: 0,
          }}>{prefix}</span>
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
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: prefix ? '9px 12px 9px 0' : '9px 12px',
            font: '500 14px var(--font-sans)', color: 'var(--fg-strong)',
          }}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 8px', color: '#9DA0B2', flexShrink: 0, lineHeight: 1 }}
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
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
            background: '#fff', border: '1px solid var(--mf-border-subtle)',
            borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)',
            maxHeight: 260, overflowY: 'auto',
            margin: 0, padding: 0, listStyle: 'none',
          }}
        >
          {suggestions.map((option, i) => (
            <li
              key={option.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(option)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', cursor: 'pointer',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--mf-divider)' : 'none',
                font: '500 14px var(--font-sans)', color: 'var(--fg-strong)',
                background: i === activeIndex ? 'var(--mf-primary-8)' : 'transparent',
              }}
            >
              {prefix && <span style={{ color: 'var(--fg-faint)', flexShrink: 0 }}>{prefix}</span>}
              <span style={{ flex: 1 }}>{option.label}</span>
              {option.hint && (
                <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
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
