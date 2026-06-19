"use client";

import { useEffect, useState } from "react";

export function InvoiceEmbed({
  src,
  title = "Tax invoice",
}: {
  src: string;
  title?: string;
}) {
  const [height, setHeight] = useState(880);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; height?: number };
      if (data.type === "vibe-invoice-height" && typeof data.height === "number") {
        setHeight(Math.max(640, Math.min(data.height + 24, 1200)));
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="invoice-frame-wrap">
      <iframe
        title={title}
        className="invoice-frame"
        src={src}
        style={{ height }}
      />
    </div>
  );
}
