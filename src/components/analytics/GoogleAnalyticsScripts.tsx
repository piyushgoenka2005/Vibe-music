import Script from "next/script";
import {
  getGaMeasurementId,
  getGtmId,
  isClientAnalyticsConfigured,
} from "@/lib/analytics/config";

export default function GoogleAnalyticsScripts() {
  if (!isClientAnalyticsConfigured()) return null;

  const measurementId = getGaMeasurementId();
  const gtmId = getGtmId();

  return (
    <>
      {gtmId ? (
        <>
          <Script id="gtm-init" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {measurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
gtag('consent','default',{
  analytics_storage:'denied',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  wait_for_update:500
});
gtag('config','${measurementId}',{
  send_page_view:false,
  anonymize_ip:true,
  allow_google_signals:false,
  allow_ad_personalization_signals:false
});`}
          </Script>
        </>
      ) : null}
    </>
  );
}
