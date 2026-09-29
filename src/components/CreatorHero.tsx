import React, { useState } from 'react';
import { CheckCircle2, Coffee, Users, Target, Share2, Github, Twitter, Globe, Youtube, ExternalLink } from 'lucide-react';
import { CreatorProfile, Language } from '../types';
import { translations } from '../i18n/translations';

interface CreatorHeroProps {
  creator: CreatorProfile;
  lang: Language;
  totalCoffees: number;
  totalSupporters: number;
}

export const CreatorHero: React.FC<CreatorHeroProps> = ({
  creator,
  lang,
  totalCoffees,
  totalSupporters,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  const goal = creator.goal;
  const currentCoffees = totalCoffees || goal.currentCoffees;
  const goalPercentage = Math.min(100, Math.round((currentCoffees / goal.targetCoffees) * 100));

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full">
      {/* Cover Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800">
        <img
          src={creator.bannerUrl}
          alt="Creator banner"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            // Elegant CSS fallback container
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Share Button top right */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/70 hover:bg-stone-900/90 text-white backdrop-blur-md text-xs font-medium transition-all"
          title={t.hero.sharePage}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? t.hero.copiedLink : t.hero.sharePage}</span>
        </button>
      </div>

      {/* Profile Info Block */}
      <div className="relative px-4 sm:px-6 -mt-16 sm:-mt-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
          {/* Avatar with status */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl p-1 bg-white dark:bg-stone-900 shadow-xl shrink-0">
            <img
              src={creator.avatarUrl}
              alt={creator.name}
              referrerPolicy="no-referrer"
              className="w-full h-full rounded-xl object-cover"
              onError={(e) => {
                // SVG fallback icon
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=creator';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white dark:border-stone-900 shadow">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Name & Tagline */}
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {creator.name}
              </h1>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                {t.hero.verifiedCreator}
              </span>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
              {creator.tagline}
            </p>

            {/* Social Links */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              {creator.socialLinks.github && (
                <a
                  href={creator.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {creator.socialLinks.twitter && (
                <a
                  href={creator.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                  title="Twitter / X"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {creator.socialLinks.website && (
                <a
                  href={creator.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                  title="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {creator.socialLinks.youtube && (
                <a
                  href={creator.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 py-2 px-4 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 shrink-0">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-bold text-lg tabular-nums">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>{currentCoffees.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {t.hero.coffeesReceived}
              </span>
            </div>
            <div className="w-px h-8 bg-stone-300 dark:bg-stone-700" />
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-bold text-lg tabular-nums">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>{totalSupporters.toLocaleString()}</span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {t.hero.supportersCount}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div id="about" className="mt-5 text-stone-700 dark:text-stone-300 text-sm leading-relaxed max-w-3xl">
          <p className={showFullBio ? '' : 'line-clamp-2'}>
            {creator.bio}
          </p>
          {creator.bio.length > 150 && (
            <button
              onClick={() => setShowFullBio(!showFullBio)}
              className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline mt-1 focus:outline-none"
            >
              {showFullBio ? (lang === 'vi' ? 'Thu gọn' : 'Show less') : (lang === 'vi' ? 'Xem thêm' : 'Read more')}
            </button>
          )}
        </div>

        {/* Community Goal Progress Bar */}
        {goal.enabled !== false && <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-800/90 dark:to-stone-800/60 border border-amber-200/80 dark:border-stone-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-400">
                  {t.hero.goalTitle}
                </h4>
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                  {goal.title}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 tabular-nums">
                {currentCoffees} / {goal.targetCoffees} ☕ ({goalPercentage}% {t.hero.goalProgress})
              </span>
            </div>
          </div>

          {/* Progress track */}
          <div className="w-full bg-amber-200/70 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
        </div>}
      </div>
    </div>
  );
};
