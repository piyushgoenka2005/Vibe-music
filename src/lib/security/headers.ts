export const SECURITY_HEADERS = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://cdnjs.cloudflare.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.vibemusic.in https://accounts.google.com https://checkout.razorpay.com https://*.razorpay.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https://cdn.vibemusic.in https://checkout.razorpay.com https://*.razorpay.com",
      "connect-src 'self' blob: https://*.googleapis.com https://*.firebaseio.com https://firebase.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://*.cloudinary.com https://api.web3forms.com https://static.roland.com https://tonejs.github.io wss://*.firebaseio.com",
      "media-src 'self' blob: https://static.roland.com https://tonejs.github.io",
      "worker-src 'self' blob:",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://sketchfab.com https://www.youtube.com https://www.youtube-nocookie.com",
    ].join("; "),
  },
] as const;

export const API_SECURITY_HEADERS = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Content-Type-Options", value: "nosniff" },
] as const;
