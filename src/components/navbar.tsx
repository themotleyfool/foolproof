import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../lib/api';

const TABS = [
  { path: '/build',  label: 'Build Knowledge' },
  { path: '/find',   label: 'Find Answer'     },
  { path: '/browse', label: 'Browse'          },
];

/**
 * Top navigation bar. Renders the FoolProof brand, centered route links,
 * and a stats pill showing total entries and channels.
 */
export function Navbar() {
  const { data: stats = { entriesCount: 0, channelsCount: 0 } } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  return (
    <header className="bg-content-100 h-[60px] shrink-0 flex items-center px-6 relative">
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

      {/* Centered nav */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
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

      {/* Stats pill */}
      <div className="flex items-center gap-[7px] bg-white/6 border border-white/10 rounded-full px-[14px] py-[5px] shrink-0 ml-auto">
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
    </header>
  );
}
