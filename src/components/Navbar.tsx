import { useState } from 'react';
import { LogIn, Menu, UserCheck, X } from 'lucide-react';
import type { InstagramAuthState } from '../types/ingress';

interface NavbarProps {
  authState: InstagramAuthState;
  onOpenLogin: () => void;
}

const NAV_LINKS = [
  { href: '#my-account', label: 'My Account' },
  { href: '#free-plan', label: 'Free Toolkit' },
  { href: '#follow-back', label: 'Follow-Back' },
  { href: '#funnel', label: 'Growth Funnel' },
  { href: '#audit', label: 'Strategy Audit' },
];

export function Navbar({ authState, onOpenLogin }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#F9FAFB]/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-4 rounded"
        >
          Ingress
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap shrink-0 hover:text-slate-950 underline-offset-4 hover:underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-4 rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action (Instagram Login / Active Account) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-testid="navbar-login-btn"
            onClick={onOpenLogin}
            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-950 rounded-lg hover:bg-slate-800 active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
          >
            {authState.signedIn ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="font-mono text-xs">{authState.handle}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Instagram Login</span>
              </>
            )}
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950 rounded-lg"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenLogin();
            }}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-950 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            {authState.signedIn ? (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="font-mono text-xs">Signed in: {authState.handle}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Instagram Login</span>
              </>
            )}
          </button>
        </nav>
      )}
    </header>
  );
}
