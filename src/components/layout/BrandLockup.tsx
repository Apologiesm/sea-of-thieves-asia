import Image from "next/image";

/**
 * Sea of Thieves Asia wordmark.
 *
 * The artwork is the community's own gold lockup (`public/brand/logo-asia.png`,
 * 644×456, transparent) and is served through the Next image optimiser so the
 * header ships a small file rather than the 350 kB master. The site stays an
 * unofficial fan project: the non-affiliation notice lives in the footer and in
 * the hero eyebrow, not in the mark itself.
 */
export function BrandLockup({
  size = "sm",
  priority = false,
}: {
  size?: "sm" | "lg";
  priority?: boolean;
}) {
  return (
    <span className={`brand-lockup brand-lockup--${size}`}>
      <Image
        src="/brand/logo-asia.png"
        alt="Sea of Thieves Asia"
        width={644}
        height={456}
        priority={priority}
        sizes={size === "lg" ? "136px" : "(min-width: 640px) 74px, 64px"}
        className="brand-lockup__logo"
      />
    </span>
  );
}
