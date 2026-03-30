import { Outlet } from "react-router-dom";

const ShieldLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="none"
    className={className}
  >
    <defs>
      <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
      </linearGradient>
      <linearGradient id="innerGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
      </linearGradient>
    </defs>
    <path
      d="M256 28 L462 120 C462 120 472 320 256 484 C40 320 50 120 50 120 Z"
      fill="url(#shieldGrad)"
    />
    <path
      d="M256 60 L432 138 C432 138 440 310 256 452 C72 310 80 138 80 138 Z"
      fill="url(#innerGrad)"
    />
    <circle cx="256" cy="210" r="52" fill="#6366f1" opacity="0.85" />
    <path
      d="M230 240 L226 340 C226 348 234 354 256 354 C278 354 286 348 286 340 L282 240 Z"
      fill="#6366f1"
      opacity="0.85"
    />
    <circle cx="256" cy="210" r="30" fill="#6366f1" opacity="0.15" />
  </svg>
);

const Root = () => {
  return (
    <div className="flex flex-col h-screen md:flex-row">
      <div className="flex-1 flex justify-center items-center p-8">
        <Outlet />
      </div>
      <div className="flex-1 relative overflow-hidden hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-12">
          <ShieldLogo className="w-32 h-32 drop-shadow-2xl" />
          <h1 className="text-white text-5xl font-bold tracking-tight">
            AuthGuard
          </h1>
          <p className="text-white/70 text-lg text-center max-w-sm leading-relaxed">
            Drop-in authentication for your apps. Registration, login, MFA, and
            SSO — handled.
          </p>
          <div className="flex gap-3 mt-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm">
              JWT + ES256
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm">
              PKCE OAuth
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 backdrop-blur-sm">
              MFA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Root;
