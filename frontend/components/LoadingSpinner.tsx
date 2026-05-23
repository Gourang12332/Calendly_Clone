type LoadingSpinnerProps = {
  text?: string;
  fullScreen?: boolean;
  showText?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-9 w-20",
  md: "h-12 w-28",
  lg: "h-16 w-36",
};

export default function LoadingSpinner({
  text = "Loading",
  fullScreen = false,
  showText = false,
  className = "",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullScreen ? "min-h-screen" : ""} flex items-center justify-center ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <svg
          viewBox="0 0 128 52"
          className={`${sizes[size]} overflow-visible`}
          aria-hidden="true"
        >
          <circle className="loader-orbit-dot" cx="64" cy="26" r="2" />

          <rect className="loader-piece loader-left" x="10" y="14" width="20" height="22" rx="4" />
          <rect className="loader-piece loader-center" x="43" y="9" width="38" height="32" rx="9" />
          <rect className="loader-piece loader-right" x="88" y="14" width="20" height="22" rx="4" />
        </svg>

        {showText ? (
          <p className="text-sm font-medium text-gray-500">{text}</p>
        ) : (
          <span className="sr-only">{text}</span>
        )}
      </div>

      <style>{`
        .loader-piece {
          fill: #426789;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 1px 1px rgba(15, 23, 42, 0.08));
        }

        .loader-orbit-dot {
          fill: #dce5ec;
          transform-box: fill-box;
          transform-origin: center;
          animation: loaderOrbit 1.45s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .loader-left {
          animation: loaderLeft 1.45s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .loader-center {
          animation: loaderCenter 1.45s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        .loader-right {
          animation: loaderRight 1.45s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes loaderOrbit {
          0% {
            transform: translateX(70px) scale(1);
            opacity: 0.9;
          }
          20% {
            transform: translateX(30px) scale(0.78);
            opacity: 0.28;
          }
          50% {
            transform: translateX(-70px) scale(1);
            opacity: 0.9;
          }
          70% {
            transform: translateX(-30px) scale(0.78);
            opacity: 0.28;
          }
          100% {
            transform: translateX(30px) scale(1);
            opacity: 0.9;
          }
        }

        @keyframes loaderLeft {
          0%, 100% {
            transform: translateX(0) scale(0.9);
            opacity: 0.7;
          }
          18% {
            transform: translateX(2px) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-4px) scale(1.02);
            opacity: 1;
          }
          72% {
            transform: translateX(-8px) scale(0.88);
            opacity: 0.62;
          }
        }

        @keyframes loaderCenter {
          0%, 100% {
            transform: scaleX(0.96) scaleY(0.98);
          }
          25% {
            transform: scaleX(1.08) scaleY(1.05);
          }
          50% {
            transform: scaleX(1) scaleY(1.02);
          }
          75% {
            transform: scaleX(1.08) scaleY(1.05);
          }
        }

        @keyframes loaderRight {
          0%, 100% {
            transform: translateX(4px) scale(1.02);
            opacity: 1;
          }
          22% {
            transform: translateX(8px) scale(0.88);
            opacity: 0.62;
          }
          50% {
            transform: translateX(0) scale(0.9);
            opacity: 0.7;
          }
          70% {
            transform: translateX(-2px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
