import React from 'react';
import { Coffee, Moon, Sun, Globe, Shield, BookOpen, Heart } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onOpenAdmin,
  onOpenGuide,
  isAdminLoggedIn,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text wordmark */}
        <a href="#" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t.nav.brand}
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          <a
            href="#donate"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-amber-500" />
            <span>{lang === 'vi' ? 'Mời cà phê' : 'Support'}</span>
          </a>
          <a
            href="#supporters"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {t.nav.supporters}
          </a>
          <a
            href="#about"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {t.nav.about}
          </a>
          <button
            onClick={onOpenGuide}
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 text-left"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.nav.guide}</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Đổi ngôn ngữ / Switch Language"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-stone-700" />
            )}
          </button>

          {/* Admin Portal Button */}
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              isAdminLoggedIn
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isAdminLoggedIn ? (lang === 'vi' ? 'Quản trị' : 'Dashboard') : t.nav.admin}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
