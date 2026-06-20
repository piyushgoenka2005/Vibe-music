"use client";

import React from "react";
import { cn } from "@/lib/utils";

const GLASS_FILTER_ID = "glass-distortion";
const GLASS_EASE = "cubic-bezier(0.175, 0.885, 0.32, 2.2)";

export interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  target?: string;
  interactive?: boolean;
}

export interface DockIcon {
  src: string;
  alt: string;
  onClick?: () => void;
}

/** SVG displacement + specular filter — mount once per page section. */
export function GlassFilter() {
  return (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <filter
        id={GLASS_FILTER_ID}
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.001 0.005"
          numOctaves={1}
          seed={17}
          result="turbulence"
        />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
          <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
          <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale={5}
          specularConstant={1}
          specularExponent={100}
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1={0}
          k2={1}
          k3={1}
          k4={0}
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale={200}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}

/** Embeddable glass layers for pills, handles, cards. */
export function GlassSurface({
  className,
  tint = "rgba(255, 255, 255, 0.25)",
}: {
  className?: string;
  tint?: string;
}) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]",
          className
        )}
        style={{
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          filter: `url(#${GLASS_FILTER_ID})`,
          isolation: "isolate",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
        style={{ background: tint }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.55), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.45)",
        }}
        aria-hidden
      />
    </>
  );
}

export function GlassEffect({
  children,
  className = "",
  style = {},
  href,
  target = "_blank",
  interactive = true,
  tone = "default",
}: GlassEffectProps & { tone?: "default" | "light" }) {
  const isLight = tone === "light";
  const glassStyle: React.CSSProperties = {
    boxShadow: isLight
      ? "0 20px 48px rgba(18, 83, 237, 0.08), 0 8px 24px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95)"
      : "0 6px 6px rgba(0, 0, 0, 0.12), 0 0 24px rgba(18, 83, 237, 0.08)",
    transitionTimingFunction: GLASS_EASE,
    ...style,
  };

  const content = (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-[inherit] font-medium transition-all duration-700",
        interactive && "cursor-pointer",
        isLight && "border border-white/85",
        className
      )}
      style={glassStyle}
    >
      <GlassSurface
        tint={isLight ? "rgba(255, 255, 255, 0.72)" : undefined}
      />
      <div className="relative z-30 w-full">{children}</div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

export interface GlassEffectButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Softer glass on white/light backgrounds */
  tone?: "default" | "light";
}

/** Interactive glass surface for toggles, payment cards, and option rows. */
export function GlassEffectButton({
  children,
  className,
  selected = false,
  tone = "default",
  style,
  type = "button",
  ...props
}: GlassEffectButtonProps) {
  const isLight = tone === "light";

  return (
    <button
      type={type}
      className={cn(
        "relative flex w-full overflow-hidden rounded-[inherit] border-0 bg-transparent p-0 text-left font-inherit transition-all duration-700",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        isLight && "border border-white/80",
        className
      )}
      style={{
        boxShadow: selected
          ? isLight
            ? "0 10px 28px rgba(18, 83, 237, 0.12), 0 0 0 1px rgba(18, 83, 237, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.95)"
            : "0 8px 24px rgba(18, 83, 237, 0.18), 0 0 0 1px rgba(18, 83, 237, 0.2)"
          : isLight
            ? "0 6px 20px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.92)"
            : "0 6px 6px rgba(0, 0, 0, 0.12), 0 0 20px rgba(0, 0, 0, 0.08)",
        transitionTimingFunction: GLASS_EASE,
        ...style,
      }}
      {...props}
    >
      <GlassSurface
        tint={
          selected
            ? isLight
              ? "rgba(255, 255, 255, 0.82)"
              : "rgba(255, 255, 255, 0.42)"
            : isLight
              ? "rgba(255, 255, 255, 0.68)"
              : "rgba(255, 255, 255, 0.25)"
        }
      />
      <div className="relative z-30 w-full">{children}</div>
    </button>
  );
}

export function GlassDock({
  icons,
  href,
}: {
  icons: DockIcon[];
  href?: string;
}) {
  return (
    <GlassEffect
      href={href}
      className="rounded-3xl p-3 hover:rounded-[2rem] hover:p-4"
    >
      <div className="flex items-center justify-center gap-2 overflow-hidden rounded-3xl p-3 px-0.5 py-0">
        {icons.map((icon) => (
          <img
            key={icon.alt}
            src={icon.src}
            alt={icon.alt}
            className="h-16 w-16 cursor-pointer transition-all duration-700 hover:scale-110"
            style={{
              transformOrigin: "center center",
              transitionTimingFunction: GLASS_EASE,
            }}
            onClick={icon.onClick}
          />
        ))}
      </div>
    </GlassEffect>
  );
}

export function GlassButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <GlassEffect
      href={href}
      className="overflow-hidden rounded-3xl px-10 py-6 hover:rounded-[2rem] hover:px-11 hover:py-7"
    >
      <div
        className="transition-all duration-700 hover:scale-95"
        style={{ transitionTimingFunction: GLASS_EASE }}
      >
        {children}
      </div>
    </GlassEffect>
  );
}

/** 21st.dev liquid glass demo — optional showcase */
export function LiquidGlassDemo() {
  const dockIcons: DockIcon[] = [
    {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop",
      alt: "Abstract blue",
    },
    {
      src: "https://images.unsplash.com/photo-1550684848-fac1c5b4a907?w=128&h=128&fit=crop",
      alt: "Gradient waves",
    },
    {
      src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=128&h=128&fit=crop",
      alt: "Color mesh",
    },
    {
      src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=128&h=128&fit=crop",
      alt: "Purple glow",
    },
    {
      src: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=128&h=128&fit=crop",
      alt: "Liquid gradient",
    },
    {
      src: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=128&h=128&fit=crop",
      alt: "Glass texture",
    },
  ];

  return (
    <div
      className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden font-light"
      style={{
        background:
          'url("https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop") center center / cover',
        animation: "moveBackground 60s linear infinite",
      }}
    >
      {/* GlassFilter is mounted once in StorefrontChrome */}
      <div className="flex w-full flex-col items-center justify-center gap-6">
        <GlassDock icons={dockIcons} />
        <GlassButton>
          <div className="text-xl text-white">
            <p>Swipe to pay securely</p>
          </div>
        </GlassButton>
      </div>
    </div>
  );
}

/** @deprecated Use LiquidGlassDemo — alias for 21st scaffold */
export const Component = LiquidGlassDemo;
