import { useId } from "react";
export function BikeIllustration({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`bike-illustration ${className}`}
      viewBox="0 0 1000 660"
      role="img"
      aria-label="Bicicleta de enduro; ilustración aproximada ATLAS"
    >
      <defs>
        <linearGradient id={`${id}frame`} x1="0" y1="0" x2=".7" y2="1">
          <stop stopColor="#d7d6d0" />
          <stop offset=".35" stopColor="#8d918a" />
          <stop offset=".7" stopColor="#444b43" />
          <stop offset="1" stopColor="#78806f" />
        </linearGradient>
        <linearGradient id={`${id}fork`}>
          <stop stopColor="#ba9e69" />
          <stop offset=".4" stopColor="#edd7a5" />
          <stop offset="1" stopColor="#867142" />
        </linearGradient>
        <radialGradient id={`${id}rim`}>
          <stop offset=".84" stopColor="#414343" />
          <stop offset=".88" stopColor="#111414" />
          <stop offset=".94" stopColor="#303332" />
          <stop offset="1" stopColor="#080b09" />
        </radialGradient>
        <filter
          id={`${id}shadow`}
          x="-50%"
          y="-100%"
          width="200%"
          height="300%"
        >
          <feGaussianBlur stdDeviation="13" />
        </filter>
      </defs>
      <ellipse
        cx="510"
        cy="565"
        rx="390"
        ry="15"
        fill="#050705"
        opacity=".8"
        filter={`url(#${id}shadow)`}
      />
      {[245, 755].map((x, index) => (
        <g key={x}>
          <circle
            cx={x}
            cy="414"
            r={index === 0 ? 135 : 141}
            fill={`url(#${id}rim)`}
          />
          <circle
            cx={x}
            cy="414"
            r={index === 0 ? 113 : 119}
            fill="#131814"
            stroke="#52564e"
            strokeWidth="3"
          />
          {Array.from({ length: 28 }, (_, n) => {
            const a = (n * Math.PI) / 14;
            return (
              <line
                key={n}
                x1={x + Math.cos(a) * 10}
                y1={414 + Math.sin(a) * 10}
                x2={x + Math.cos(a + 0.22) * (index === 0 ? 112 : 118)}
                y2={414 + Math.sin(a + 0.22) * (index === 0 ? 112 : 118)}
                stroke="#646b60"
                strokeWidth=".85"
                opacity=".7"
              />
            );
          })}
          <circle
            cx={x}
            cy="414"
            r="35"
            fill="none"
            stroke="#989d93"
            strokeWidth="3"
            strokeDasharray="10 5"
          />
          <circle cx={x} cy="414" r="9" fill="#b7b8a6" />
          <path
            d={`M${x - 77} 307 a132 132 0 0 1 158 0`}
            stroke="#959a8b"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5 7"
            opacity=".4"
          />
        </g>
      ))}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M246 414 L432 311 L462 443 L246 414 L386 350 L438 315"
          stroke="#252c26"
          strokeWidth="14"
        />
        <path
          d="M246 414 L420 307 L461 441 L246 414"
          stroke={`url(#${id}frame)`}
          strokeWidth="10"
        />
        <path
          d="M443 293 L642 270 L658 308 L482 441 L460 438 L419 296 Z"
          stroke={`url(#${id}frame)`}
          strokeWidth="21"
        />
        <path
          d="M463 429 L644 309"
          stroke="#d2d4c1"
          strokeWidth="2"
          opacity=".5"
        />
        <path
          d="M447 286 L640 278"
          stroke="#f5f4de"
          strokeWidth="2"
          opacity=".5"
        />
        <path d="M436 314 L496 357" stroke="#232922" strokeWidth="17" />
        <path d="M444 317 L493 353" stroke="#bfc7b5" strokeWidth="7" />
        <path
          d="M444 317 L484 347"
          stroke="#252c27"
          strokeWidth="15"
          strokeDasharray="3 3"
        />
        <path
          d="M647 295 L709 362"
          stroke={`url(#${id}fork)`}
          strokeWidth="12"
        />
        <path
          d="M662 289 L728 364"
          stroke={`url(#${id}fork)`}
          strokeWidth="10"
        />
        <path d="M707 355 L755 414" stroke="#171e17" strokeWidth="20" />
        <path d="M726 353 L767 401" stroke="#252f23" strokeWidth="17" />
        <path d="M717 359 L734 352" stroke="#485340" strokeWidth="15" />
        <path d="M430 289 L416 246" stroke="#c3c5b4" strokeWidth="8" />
        <path d="M393 244 Q418 234 454 238" stroke="#0b100d" strokeWidth="13" />
        <path
          d="M642 274 L624 247 L613 231"
          stroke="#181e19"
          strokeWidth="12"
        />
        <path d="M577 235 L614 231 L648 222" stroke="#b0b5a6" strokeWidth="8" />
        <path
          d="M576 235 L592 233 M634 225 L649 221"
          stroke="#1f2520"
          strokeWidth="12"
        />
        <path
          d="M633 232 Q703 224 718 341"
          stroke="#6a7164"
          strokeWidth="1.8"
        />
        <path d="M626 239 Q605 286 515 366" stroke="#151b16" strokeWidth="2" />
        <path
          d="M254 404 L463 423 L478 456 L267 435 Z"
          stroke="#7b8075"
          strokeWidth="2"
        />
        <circle cx="466" cy="441" r="30" stroke="#101610" strokeWidth="8" />
        <circle
          cx="466"
          cy="441"
          r="24"
          stroke="#8a9182"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <path d="M466 441 L489 482" stroke="#181e18" strokeWidth="12" />
        <path d="M474 481 L508 481" stroke="#7c826f" strokeWidth="7" />
        <path d="M255 426 L278 453 L273 477" stroke="#131a14" strokeWidth="9" />
        <circle cx="272" cy="473" r="7" stroke="#a6aa98" strokeWidth="3" />
      </g>
      <text
        x="528"
        y="371"
        fill="#e2e4d7"
        fontSize="16"
        letterSpacing="4"
        transform="rotate(-36 528 371)"
        fontWeight="700"
      >
        ATLAS
      </text>
    </svg>
  );
}
