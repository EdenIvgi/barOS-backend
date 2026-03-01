export function AnimatedBackground() {
  return (
    <div className="animated-background" aria-hidden="true">
      {/* Martini glass */}
      <svg className="float-glass float-1" viewBox="0 0 80 120" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 10 L40 50 L70 10" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="40" y1="50" x2="40" y2="95" />
        <line x1="25" y1="95" x2="55" y2="95" strokeLinecap="round" />
        <ellipse cx="40" cy="10" rx="30" ry="4" />
      </svg>

      {/* Wine glass */}
      <svg className="float-glass float-2" viewBox="0 0 80 130" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M25 5 Q25 55 40 65 Q55 55 55 5" strokeLinecap="round" />
        <line x1="40" y1="65" x2="40" y2="105" />
        <ellipse cx="40" cy="105" rx="18" ry="4" />
        <path d="M25 5 Q40 12 55 5" />
      </svg>

      {/* Cocktail coupe */}
      <svg className="float-glass float-3" viewBox="0 0 90 120" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 15 Q45 55 75 15" strokeLinecap="round" />
        <path d="M15 15 Q45 25 75 15" />
        <line x1="45" y1="40" x2="45" y2="95" />
        <line x1="28" y1="95" x2="62" y2="95" strokeLinecap="round" />
      </svg>

      {/* Highball / Collins glass */}
      <svg className="float-glass float-4" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 8 L16 105 L44 105 L48 8 Z" strokeLinejoin="round" />
        <line x1="14" y1="55" x2="46" y2="55" opacity="0.4" />
        <circle cx="25" cy="75" r="3" opacity="0.3" />
        <circle cx="35" cy="85" r="2.5" opacity="0.3" />
      </svg>

      {/* Shot glass */}
      <svg className="float-glass float-5" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 5 L14 55 L36 55 L40 5 Z" strokeLinejoin="round" />
        <line x1="12" y1="30" x2="38" y2="30" opacity="0.4" />
      </svg>

      {/* Champagne flute */}
      <svg className="float-glass float-6" viewBox="0 0 60 140" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="30" cy="12" rx="14" ry="5" />
        <path d="M16 12 Q28 60 30 70 Q32 60 44 12" />
        <line x1="30" y1="70" x2="30" y2="115" />
        <ellipse cx="30" cy="115" rx="15" ry="4" />
      </svg>
    </div>
  )
}
