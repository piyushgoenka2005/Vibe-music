import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1253ED 0%, #0A3496 100%)",
          color: "#ffffff",
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "-0.04em",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#ffffff" }}>vibe</span>
          <span style={{ color: "#f2f1f0" }}>music</span>
        </div>
        <div
          style={{
            fontSize: 32,
            maxWidth: 800,
            textAlign: "center",
            lineHeight: 1.4,
            opacity: 0.92,
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size }
  );
}
