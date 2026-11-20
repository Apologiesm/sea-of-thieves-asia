/** Original typographic mark. No official logo, font or artwork is used. */
export function BrandLockup({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span className={`brand-lockup brand-lockup--${size}`}>
      <span className="brand-lockup__mark" aria-hidden="true"><span /></span>
      <span className="brand-lockup__text">
        <span className="brand-lockup__top">Sea of Thieves</span>
        <span className="brand-lockup__bottom">Asia</span>
      </span>
    </span>
  );
}
