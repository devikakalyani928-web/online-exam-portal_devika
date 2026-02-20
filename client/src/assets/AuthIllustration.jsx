const AuthIllustration = () => (
  <svg viewBox="0 0 500 420" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Floor shadow */}
    <ellipse cx="250" cy="380" rx="200" ry="14" fill="#e8e8e8" />

    {/* Desk */}
    <rect x="140" y="270" width="220" height="12" rx="3" fill="#3b3b3b" />
    <rect x="155" y="282" width="8" height="95" fill="#3b3b3b" />
    <rect x="337" y="282" width="8" height="95" fill="#3b3b3b" />
    <rect x="145" y="370" width="28" height="6" rx="2" fill="#3b3b3b" />
    <rect x="327" y="370" width="28" height="6" rx="2" fill="#3b3b3b" />

    {/* Monitor stand */}
    <rect x="245" y="215" width="10" height="55" fill="#c4c4c4" />
    <rect x="225" y="265" width="50" height="6" rx="3" fill="#d4d4d4" />

    {/* Monitor */}
    <rect x="185" y="110" width="130" height="105" rx="8" fill="#e0e7ff" stroke="#bfcfff" strokeWidth="2" />
    <rect x="192" y="117" width="116" height="85" rx="4" fill="#4f8cff" />

    {/* Screen content - login form */}
    <rect x="210" y="130" width="80" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
    <rect x="210" y="145" width="80" height="8" rx="4" fill="rgba(255,255,255,0.25)" />
    <rect x="210" y="160" width="50" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
    <rect x="220" y="178" width="60" height="12" rx="6" fill="#2563eb" />
    <text x="250" y="187" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">Login</text>

    {/* Small circle on monitor top */}
    <circle cx="250" cy="208" r="3" fill="#d4d4d4" />

    {/* Chart/dashboard floating panel - right */}
    <rect x="320" y="130" width="80" height="100" rx="6" fill="white" stroke="#e0e0e0" strokeWidth="1.5" opacity="0.9" />
    {/* Pie chart */}
    <circle cx="360" cy="158" r="16" fill="#e0e7ff" />
    <path d="M360 142 A16 16 0 0 1 376 158 L360 158 Z" fill="#2563eb" />
    {/* Bar chart lines */}
    <rect x="335" y="185" width="8" height="25" rx="2" fill="#2563eb" />
    <rect x="348" y="192" width="8" height="18" rx="2" fill="#93c5fd" />
    <rect x="361" y="180" width="8" height="30" rx="2" fill="#2563eb" />
    <rect x="374" y="195" width="8" height="15" rx="2" fill="#93c5fd" />
    <rect x="387" y="188" width="8" height="22" rx="2" fill="#60a5fa" />

    {/* Small dots chart - upper right */}
    <rect x="330" y="85" width="60" height="40" rx="5" fill="white" stroke="#e0e0e0" strokeWidth="1" opacity="0.8" />
    <circle cx="342" cy="110" r="3" fill="#2563eb" />
    <circle cx="352" cy="103" r="3" fill="#60a5fa" />
    <circle cx="362" cy="108" r="3" fill="#2563eb" />
    <circle cx="372" cy="98" r="3" fill="#93c5fd" />
    <circle cx="382" cy="104" r="3" fill="#2563eb" />
    <path d="M342 110 L352 103 L362 108 L372 98 L382 104" stroke="#2563eb" strokeWidth="1" fill="none" opacity="0.5" />

    {/* Person - sitting in chair */}
    {/* Chair */}
    <ellipse cx="120" cy="375" rx="22" ry="5" fill="#2563eb" opacity="0.15" />
    <rect x="85" y="290" width="70" height="55" rx="8" fill="#2563eb" />
    <rect x="82" y="270" width="8" height="105" rx="4" fill="#1e40af" />
    <circle cx="96" cy="375" r="8" fill="#1e40af" />
    <circle cx="144" cy="375" r="8" fill="#1e40af" />
    <circle cx="96" cy="375" r="4" fill="#93c5fd" />
    <circle cx="144" cy="375" r="4" fill="#93c5fd" />

    {/* Person head */}
    <circle cx="120" cy="230" r="22" fill="#c68642" />
    {/* Hair */}
    <path d="M100 225 C100 210 115 200 130 205 C140 208 142 220 140 228" fill="#2d2d2d" />
    {/* Body - torso */}
    <path d="M105 252 C105 248 110 245 120 245 C130 245 135 248 135 252 L140 310 L100 310 Z" fill="#374151" />
    {/* Shirt/tie */}
    <rect x="116" y="252" width="8" height="35" fill="#60a5fa" opacity="0.7" />
    {/* Arms */}
    <path d="M105 260 L80 290 L90 295" stroke="#c68642" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M135 260 L170 280 L175 275" stroke="#c68642" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Hands on keyboard area */}
    <circle cx="175" cy="275" r="6" fill="#c68642" />
    <circle cx="90" cy="295" r="6" fill="#c68642" />
    {/* Legs */}
    <path d="M108 310 L100 360 L90 365" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M132 310 L140 360 L150 365" stroke="#1e3a5f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Shoes */}
    <ellipse cx="85" cy="367" rx="12" ry="5" fill="#1a1a1a" />
    <ellipse cx="155" cy="367" rx="12" ry="5" fill="#1a1a1a" />

    {/* Keyboard on desk */}
    <rect x="200" y="260" width="70" height="10" rx="3" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
    <rect x="280" y="258" width="30" height="12" rx="2" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />

    {/* Plant pot */}
    <rect x="370" y="320" width="30" height="35" rx="3" fill="#1e40af" />
    <rect x="365" y="315" width="40" height="8" rx="3" fill="#2563eb" />
    {/* Plant stems and leaves */}
    <path d="M385 315 C385 295 375 280 370 270" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M385 315 C385 290 395 275 400 265" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M385 315 C390 300 385 285 380 275" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" fill="none" />
    <ellipse cx="368" cy="268" rx="10" ry="7" fill="#22c55e" transform="rotate(-20 368 268)" />
    <ellipse cx="402" cy="263" rx="10" ry="7" fill="#22c55e" transform="rotate(25 402 263)" />
    <ellipse cx="378" cy="273" rx="8" ry="6" fill="#16a34a" transform="rotate(-10 378 273)" />
    <ellipse cx="395" cy="278" rx="9" ry="6" fill="#16a34a" transform="rotate(15 395 278)" />

    {/* Floating connection dots */}
    <circle cx="160" cy="100" r="4" fill="#93c5fd" opacity="0.6" />
    <circle cx="420" cy="150" r="3" fill="#60a5fa" opacity="0.5" />
    <circle cx="440" cy="200" r="5" fill="#bfdbfe" opacity="0.4" />
  </svg>
);

export default AuthIllustration;
