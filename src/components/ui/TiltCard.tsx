import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  cardClassName?: string;
};

/** Wrapper for the pointer-follow glow. No 3D rotation is applied. */
export function TiltCard({ children, className = "", cardClassName = "" }: Props) {
  return (
    <div className={`tilt ${className}`.trim()}>
      <div className={`tilt__card ${cardClassName}`.trim()} data-glow>
        <div className="tilt__content">{children}</div>
      </div>
    </div>
  );
}
