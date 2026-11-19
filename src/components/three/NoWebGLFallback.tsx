/**
 * Decorative ocean for browsers without WebGL. Pure CSS/SVG, aria-hidden,
 * so all page content remains accessible and unchanged.
 */
export function NoWebGLFallback() {
  return (
    <div className="ocean-fallback" aria-hidden="true">
      <div className="ocean-fallback__moon" />
      <svg
        className="ocean-fallback__wave ocean-fallback__wave--back"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path d="M0,90 C150,35 300,145 450,90 C600,35 750,145 900,90 C1050,35 1200,145 1200,90 L1200,200 L0,200 Z" />
      </svg>
      <svg
        className="ocean-fallback__wave ocean-fallback__wave--mid"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path d="M0,110 C180,55 330,160 510,110 C690,55 840,160 1020,110 C1110,85 1170,80 1200,95 L1200,200 L0,200 Z" />
      </svg>
      <svg
        className="ocean-fallback__wave ocean-fallback__wave--front"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <path d="M0,135 C160,90 320,180 480,135 C640,90 800,180 960,135 C1080,102 1140,105 1200,125 L1200,200 L0,200 Z" />
      </svg>
      <svg className="ocean-fallback__ship" viewBox="0 0 120 90">
        <path d="M12 58 L108 58 L96 76 L26 76 Z" />
        <path d="M58 56 L58 12 L86 50 Z" />
        <path d="M54 54 L54 20 L34 50 Z" />
      </svg>
    </div>
  );
}
