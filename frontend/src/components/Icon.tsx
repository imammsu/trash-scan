import type { CSSProperties } from "react";

interface Props {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Isi bila ikon berdiri sendiri dan bermakna (tanpa teks di sebelahnya). */
  label?: string;
}

/** Ikon Material Symbols. Dekoratif secara default (aria-hidden). */
export default function Icon({ name, size = 20, fill = false, className = "", style, label }: Props) {
  return (
    <span
      className={"ms " + className}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}`, ...style }}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}
