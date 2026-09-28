import React from 'react';
import { Coffee, Globe, Shield, BookOpen, Heart } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  onOpenAdmin: () => void;
  onOpenGuide: () => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenAdmin,
  onOpenGuide,
  isAdminLoggedIn,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 backdrop-blur-md bg-stone-900/90 border-b border-stone-800">
      <div className="max-w-6xl mx-auto w-full min-w-0 px-3 sm:px-6 min-h-16 flex items-center justify-between gap-2">
        <a href="#" className="flex items-center gap-2 min-w-0 group">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="text-sm sm:text-lg font-bold tracking-tight text-stone-100 whitespace-nowrap">
            {t.nav.brand}
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
          <a href="#donate" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-amber-500" />
            <span>{lang === 'vi' ? 'Mời cà phê' : 'Support'}</span>
          </a>
          <a href="#supporters" className="hover:text-amber-400 transition-colors">{t.nav.supporters}</a>
          <a href="#about" className="hover:text-amber-400 transition-colors">{t.nav.about}</a>
          <button onClick={onOpenGuide} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-left">
            <BookOpen className="w-4 h-4" />
            <span>{t.nav.guide}</span>
          </button>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors shrink-0"
            title="Đổi ngôn ngữ / Switch Language"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500 hidden sm:block" />
            <span className="uppercase">{lang}</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              isAdminLoggedIn
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="sm:hidden">{isAdminLoggedIn ? 'Admin' : (lang === 'vi' ? 'Quản trị' : 'Admin')}</span>
            <span className="hidden sm:inline">{isAdminLoggedIn ? (lang === 'vi' ? 'Quản trị' : 'Dashboard') : t.nav.admin}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
