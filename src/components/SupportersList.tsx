import React, { useState } from 'react';
import { Coffee, Heart, MessageSquare, Search, Sparkles, User } from 'lucide-react';
import { Transaction, Language } from '../types';
import { translations } from '../i18n/translations';

interface SupportersListProps {
  supporters: Transaction[];
  lang: Language;
}

export const SupportersList: React.FC<SupportersListProps> = ({ supporters, lang }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return t.supporters.justNow;
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    
    if (diffSec < 60) return t.supporters.justNow;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${t.supporters.minutesAgo}`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ${t.supporters.hoursAgo}`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} ${t.supporters.daysAgo}`;
  };

  const filteredSupporters = supporters.filter((s) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (s.isAnonymous ? t.supporters.anonymous : s.donorName).toLowerCase().includes(term);
    const msgMatch = (s.message || '').toLowerCase().includes(term);
    return nameMatch || msgMatch;
  });

  return (
    <div id="supporters" className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-sm">
      
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {t.supporters.title}
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 tabular-nums">
              {supporters.length}
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'vi' ? 'Tìm theo tên hoặc lời nhắn...' : 'Search supporter or message...'}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-3.5">
        {filteredSupporters.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-3">
              <Coffee className="w-6 h-6" />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              {t.supporters.empty}
            </p>
          </div>
        ) : (
          filteredSupporters.map((item) => {
            const displayName = item.isAnonymous ? t.supporters.anonymous : item.donorName;
            const seed = encodeURIComponent(displayName);
            const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-stone-100 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-800/40 hover:bg-white dark:hover:bg-stone-800 transition-all hover:shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  {/* Supporter Avatar */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-700 shrink-0 border border-stone-200 dark:border-stone-600">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Supporter Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {displayName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 tabular-nums">
                          <Coffee className="w-3 h-3 text-amber-600" />
                          <span>{item.coffeeCount} {t.supporters.coffeesUnit}</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-stone-600 dark:text-stone-300 tabular-nums">
                        {formatRelativeTime(item.paidAt || item.createdAt)}
                      </span>
                    </div>

                    {/* Message if present */}
                    {item.message ? (
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 bg-white dark:bg-stone-900/60 p-2.5 rounded-lg border border-stone-200/60 dark:border-stone-800/80 leading-relaxed">
                        "{item.message}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 italic">
                        {lang === 'vi' ? 'Đã tiếp lửa sáng tạo' : 'Fueled the creative journey'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
