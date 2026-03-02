export function AnimatedBackground() {
  return (
    <div className="animated-background" aria-hidden="true">
      {/* Martini glass with olive */}
      <svg className="float-glass float-1" viewBox="0 0 100 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M15 12 L50 58 L85 12" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="50" cy="12" rx="35" ry="6" />
        <line x1="50" y1="58" x2="50" y2="115" />
        <ellipse cx="50" cy="115" rx="22" ry="5" />
        <line x1="28" y1="115" x2="72" y2="115" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="38" cy="28" r="5" strokeWidth="1" />
        <line x1="38" y1="23" x2="38" y2="15" strokeWidth="0.8" />
      </svg>

      {/* Coupe / champagne saucer */}
      <svg className="float-glass float-2" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 35 Q30 60 50 62 Q70 60 88 35" strokeLinecap="round" />
        <path d="M12 35 Q50 48 88 35" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="50" cy="32" rx="38" ry="10" />
        <line x1="50" y1="62" x2="50" y2="105" />
        <ellipse cx="50" cy="108" rx="20" ry="5" />
        <line x1="30" y1="108" x2="70" y2="108" strokeLinecap="round" strokeWidth="1.5" />
      </svg>

      {/* Old Fashioned / rocks glass with ice */}
      <svg className="float-glass float-3" viewBox="0 0 90 100" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M14 8 L20 85 L70 85 L76 8" strokeLinejoin="round" />
        <line x1="14" y1="8" x2="76" y2="8" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="17" y1="45" x2="73" y2="45" strokeWidth="0.7" opacity="0.4" />
        <rect x="28" y="30" width="12" height="12" rx="2" strokeWidth="0.8" opacity="0.35" transform="rotate(8 34 36)" />
        <rect x="48" y="26" width="14" height="14" rx="2" strokeWidth="0.8" opacity="0.35" transform="rotate(-5 55 33)" />
        <rect x="36" y="18" width="10" height="10" rx="2" strokeWidth="0.8" opacity="0.25" transform="rotate(15 41 23)" />
      </svg>

      {/* Hurricane / tiki glass */}
      <svg className="float-glass float-4" viewBox="0 0 80 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M22 10 Q16 40 20 60 Q24 80 28 90 L28 115" strokeLinecap="round" />
        <path d="M58 10 Q64 40 60 60 Q56 80 52 90 L52 115" strokeLinecap="round" />
        <ellipse cx="40" cy="10" rx="18" ry="5" />
        <ellipse cx="40" cy="115" rx="16" ry="4" />
        <line x1="24" y1="115" x2="56" y2="115" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="22" y1="50" x2="58" y2="50" strokeWidth="0.6" opacity="0.3" />
        <path d="M44 5 Q52 -8 58 2" strokeWidth="0.8" opacity="0.5" />
        <line x1="58" y1="2" x2="58" y2="-5" strokeWidth="0.8" opacity="0.5" />
      </svg>

      {/* Nick & Nora glass */}
      <svg className="float-glass float-5" viewBox="0 0 90 130" fill="none" stroke="currentColor" strokeWidth="1.2">
        <ellipse cx="45" cy="18" rx="28" ry="10" />
        <path d="M17 18 Q17 50 45 58 Q73 50 73 18" />
        <line x1="45" y1="58" x2="45" y2="105" />
        <ellipse cx="45" cy="108" rx="18" ry="4" />
        <line x1="27" y1="108" x2="63" y2="108" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M25 22 Q45 32 65 22" strokeWidth="0.7" opacity="0.4" />
      </svg>

      {/* Highball with straw and citrus */}
      <svg className="float-glass float-6" viewBox="0 0 70 120" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 8 L16 100 L54 100 L58 8" strokeLinejoin="round" />
        <line x1="12" y1="8" x2="58" y2="8" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="14" y1="50" x2="56" y2="50" strokeWidth="0.6" opacity="0.35" />
        <line x1="42" y1="0" x2="38" y2="60" strokeWidth="1" opacity="0.4" />
        <circle cx="20" cy="12" r="8" strokeWidth="0.8" opacity="0.4" />
        <path d="M16 12 Q20 16 24 12" strokeWidth="0.6" opacity="0.3" />
        <circle cx="30" cy="70" r="2.5" opacity="0.25" />
        <circle cx="40" cy="80" r="2" opacity="0.2" />
        <circle cx="25" cy="82" r="1.8" opacity="0.2" />
      </svg>

      {/* Wine glass elegant */}
      <svg className="float-glass float-7" viewBox="0 0 90 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <ellipse cx="45" cy="15" rx="25" ry="8" />
        <path d="M20 15 Q20 55 45 68 Q70 55 70 15" />
        <line x1="45" y1="68" x2="45" y2="115" />
        <ellipse cx="45" cy="118" rx="20" ry="5" />
        <line x1="25" y1="118" x2="65" y2="118" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M26 40 Q45 50 64 40" strokeWidth="0.6" opacity="0.3" />
      </svg>

      {/* Copper mug (Moscow Mule) */}
      <svg className="float-glass float-8" viewBox="0 0 90 100" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M18 10 L18 80 Q18 88 26 88 L64 88 Q72 88 72 80 L72 10" strokeLinejoin="round" />
        <line x1="18" y1="10" x2="72" y2="10" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M72 25 Q85 28 85 45 Q85 62 72 65" strokeWidth="1.2" />
        <line x1="18" y1="40" x2="72" y2="40" strokeWidth="0.6" opacity="0.3" />
        <path d="M30 5 Q38 -4 44 4" strokeWidth="0.7" opacity="0.4" />
      </svg>

      {/* === Second wave — duplicates at different positions === */}

      {/* Martini 2 */}
      <svg className="float-glass float-9" viewBox="0 0 100 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M15 12 L50 58 L85 12" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="50" cy="12" rx="35" ry="6" />
        <line x1="50" y1="58" x2="50" y2="115" />
        <ellipse cx="50" cy="115" rx="22" ry="5" />
        <line x1="28" y1="115" x2="72" y2="115" strokeLinecap="round" strokeWidth="1.5" />
        <circle cx="38" cy="28" r="5" strokeWidth="1" />
        <line x1="38" y1="23" x2="38" y2="15" strokeWidth="0.8" />
      </svg>

      {/* Coupe 2 */}
      <svg className="float-glass float-10" viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 35 Q30 60 50 62 Q70 60 88 35" strokeLinecap="round" />
        <path d="M12 35 Q50 48 88 35" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="50" cy="32" rx="38" ry="10" />
        <line x1="50" y1="62" x2="50" y2="105" />
        <ellipse cx="50" cy="108" rx="20" ry="5" />
        <line x1="30" y1="108" x2="70" y2="108" strokeLinecap="round" strokeWidth="1.5" />
      </svg>

      {/* Old Fashioned 2 */}
      <svg className="float-glass float-11" viewBox="0 0 90 100" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M14 8 L20 85 L70 85 L76 8" strokeLinejoin="round" />
        <line x1="14" y1="8" x2="76" y2="8" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="17" y1="45" x2="73" y2="45" strokeWidth="0.7" opacity="0.4" />
        <rect x="28" y="30" width="12" height="12" rx="2" strokeWidth="0.8" opacity="0.35" transform="rotate(8 34 36)" />
        <rect x="48" y="26" width="14" height="14" rx="2" strokeWidth="0.8" opacity="0.35" transform="rotate(-5 55 33)" />
      </svg>

      {/* Wine 2 */}
      <svg className="float-glass float-12" viewBox="0 0 90 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <ellipse cx="45" cy="15" rx="25" ry="8" />
        <path d="M20 15 Q20 55 45 68 Q70 55 70 15" />
        <line x1="45" y1="68" x2="45" y2="115" />
        <ellipse cx="45" cy="118" rx="20" ry="5" />
        <line x1="25" y1="118" x2="65" y2="118" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M26 40 Q45 50 64 40" strokeWidth="0.6" opacity="0.3" />
      </svg>

      {/* Highball 2 */}
      <svg className="float-glass float-13" viewBox="0 0 70 120" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 8 L16 100 L54 100 L58 8" strokeLinejoin="round" />
        <line x1="12" y1="8" x2="58" y2="8" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="14" y1="50" x2="56" y2="50" strokeWidth="0.6" opacity="0.35" />
        <line x1="42" y1="0" x2="38" y2="60" strokeWidth="1" opacity="0.4" />
        <circle cx="30" cy="70" r="2.5" opacity="0.25" />
        <circle cx="40" cy="80" r="2" opacity="0.2" />
      </svg>

      {/* Nick & Nora 2 */}
      <svg className="float-glass float-14" viewBox="0 0 90 130" fill="none" stroke="currentColor" strokeWidth="1.2">
        <ellipse cx="45" cy="18" rx="28" ry="10" />
        <path d="M17 18 Q17 50 45 58 Q73 50 73 18" />
        <line x1="45" y1="58" x2="45" y2="105" />
        <ellipse cx="45" cy="108" rx="18" ry="4" />
        <line x1="27" y1="108" x2="63" y2="108" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M25 22 Q45 32 65 22" strokeWidth="0.7" opacity="0.4" />
      </svg>

      {/* Hurricane 2 */}
      <svg className="float-glass float-15" viewBox="0 0 80 140" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M22 10 Q16 40 20 60 Q24 80 28 90 L28 115" strokeLinecap="round" />
        <path d="M58 10 Q64 40 60 60 Q56 80 52 90 L52 115" strokeLinecap="round" />
        <ellipse cx="40" cy="10" rx="18" ry="5" />
        <ellipse cx="40" cy="115" rx="16" ry="4" />
        <line x1="24" y1="115" x2="56" y2="115" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="22" y1="50" x2="58" y2="50" strokeWidth="0.6" opacity="0.3" />
      </svg>

      {/* Mug 2 */}
      <svg className="float-glass float-16" viewBox="0 0 90 100" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M18 10 L18 80 Q18 88 26 88 L64 88 Q72 88 72 80 L72 10" strokeLinejoin="round" />
        <line x1="18" y1="10" x2="72" y2="10" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M72 25 Q85 28 85 45 Q85 62 72 65" strokeWidth="1.2" />
        <line x1="18" y1="40" x2="72" y2="40" strokeWidth="0.6" opacity="0.3" />
      </svg>
    </div>
  )
}
