"use client";

import Script from "next/script";

/**
 * Optional live chat (Crisp). Set NEXT_PUBLIC_CRISP_WEBSITE_ID to enable (L-04).
 */
export default function SupportChatLoader() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim();
  if (!websiteId) return null;

  return (
    <Script id="crisp-support-chat" strategy="lazyOnload">
      {`window.$crisp=[];window.CRISP_WEBSITE_ID="${websiteId}";(function(){var d=document,s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`}
    </Script>
  );
}
