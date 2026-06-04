import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchStats } from '../utils/api';

const TABS = [
  { path: '/find',   label: 'Find Answer'     },
  { path: '/browse', label: 'Browse'          },
  { path: '/build',  label: 'Build Knowledge' },
];

/**
 * Top navigation bar. Renders the FoolProof brand, centered route links,
 * a stats pill, and a hamburger menu on mobile.
 */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: stats = { entriesCount: 0, channelsCount: 0 } } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <header className="bg-content-100 shrink-0 relative">
      <div className="h-[60px] flex items-center px-6">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/logo-jester-hat.svg"
            alt="Motley Fool"
            className="h-7 block shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="flex items-baseline">
            <span className="text-base font-bold text-white tracking-tight">Fool</span>
            <span className="text-base font-black text-primary-24 tracking-tight">Proof</span>
          </div>
        </div>

        {/* Desktop centered nav */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `h-8 px-4 rounded-full text-sm font-semibold no-underline transition-colors duration-[120ms] flex items-center ${
                  isActive
                    ? 'bg-white/12 text-white font-bold'
                    : 'text-content-50 hover:bg-white/8 hover:text-content-24'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Stats pill — hidden on small screens */}
          <div className="hidden sm:flex items-center gap-[7px] bg-white/6 border border-white/10 rounded-full px-[14px] py-[5px] shrink-0">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect x="0.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
              <rect x="6.5" y="0.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
              <rect x="0.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
              <rect x="6.5" y="6.5" width="4" height="4" rx="0.5" stroke="#9DA0B2" strokeWidth="1"/>
            </svg>
            <span className="text-xs font-medium text-content-50">
              <strong className="text-content-24">{stats.entriesCount}</strong>
              {' '}entr{stats.entriesCount === 1 ? 'y' : 'ies'}
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-content-70 shrink-0 block" />
            <span className="text-xs font-medium text-content-50">
              <strong className="text-content-24">{stats.channelsCount}</strong>
              {' '}{stats.channelsCount === 1 ? 'channel' : 'channels'}
            </span>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-[5px] bg-transparent border-0 cursor-pointer p-0 shrink-0"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-[2px] bg-content-50 rounded-full origin-center transition-transform duration-200 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-5 h-[2px] bg-content-50 rounded-full transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[2px] bg-content-50 rounded-full origin-center transition-transform duration-200 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1">
          {TABS.map(tab => (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-4 py-[10px] rounded-[8px] text-sm font-semibold no-underline transition-colors duration-[120ms] ${
                  isActive
                    ? 'bg-white/12 text-white font-bold'
                    : 'text-content-50 hover:bg-white/8 hover:text-content-24'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
