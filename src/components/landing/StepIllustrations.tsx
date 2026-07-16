// Pictogramas de marca para las step cards de la landing: formas planas
// (círculos crema de fondo + figuras en verde/terracota) en el mismo
// lenguaje que el logo-mark. Los colores usan tokens (`fill-*`) para
// adaptarse a claro/oscuro. Decorativos: siempre `aria-hidden`.

type IllustrationProps = { className?: string };

function Figure({
  cx,
  cy,
  r,
  clipId,
  headR,
  bodyClass,
}: {
  cx: number;
  cy: number;
  r: number;
  clipId: string;
  headR: number;
  bodyClass: string;
}) {
  const bodyWidth = r * 1.18;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-accent" />
      <clipPath id={clipId}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} className={bodyClass}>
        <circle cx={cx} cy={cy - r * 0.35} r={headR} />
        <rect
          x={cx - bodyWidth / 2}
          y={cy + r * 0.15}
          width={bodyWidth}
          height={r * 1.1}
          rx={bodyWidth / 2}
        />
      </g>
    </g>
  );
}

/** Paso 1 — trío de figuras (la del centro, terracota, delante). */
export function LovedOnesIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 72" aria-hidden className={className}>
      <Figure cx={38} cy={40} r={17} clipId="ill-people-l" headR={5.5} bodyClass="fill-primary" />
      <Figure cx={102} cy={40} r={17} clipId="ill-people-r" headR={5.5} bodyClass="fill-primary" />
      <Figure cx={70} cy={34} r={20} clipId="ill-people-c" headR={6.5} bodyClass="fill-secondary" />
    </svg>
  );
}

/** Paso 2 — campana con badge de aviso. */
export function RemindersIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 72" aria-hidden className={className}>
      <circle cx={70} cy={38} r={26} className="fill-accent" />
      <g className="fill-primary">
        <circle cx={70} cy={21} r={2.5} />
        <path d="M58 44 v-10 a12 12 0 0 1 24 0 v10 q0 3 2.5 5 h-29 q2.5 -2 2.5 -5 z" />
        <circle cx={70} cy={53.5} r={3.5} />
      </g>
      <circle cx={87} cy={21} r={6} className="fill-secondary" />
    </svg>
  );
}

/** Paso 3 — regalo con lazo y destellos. */
export function GiftIdeasIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 140 72" aria-hidden className={className}>
      <circle cx={70} cy={38} r={26} className="fill-accent" />
      <g className="fill-primary">
        <rect x={56} y={35} width={28} height={20} rx={3} />
        <rect x={52} y={26} width={36} height={9} rx={3} />
      </g>
      <g className="fill-secondary">
        <rect x={67} y={26} width={6} height={29} />
        <circle cx={63.5} cy={22} r={4.5} />
        <circle cx={76.5} cy={22} r={4.5} />
      </g>
      <path
        d="M44 11 C45.2 15.8 46.2 16.8 51 18 C46.2 19.2 45.2 20.2 44 25 C42.8 20.2 41.8 19.2 37 18 C41.8 16.8 42.8 15.8 44 11 Z"
        className="fill-chart-3"
      />
      <path
        d="M100 23 C100.9 26.4 101.6 27.1 105 28 C101.6 28.9 100.9 29.6 100 33 C99.1 29.6 98.4 28.9 95 28 C98.4 27.1 99.1 26.4 100 23 Z"
        className="fill-secondary"
      />
    </svg>
  );
}
