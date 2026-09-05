import Script from "next/script";
import {
  ANALYTICS_CONSENT_KEY,
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
          <Script id="gtm-init" strategy="afterInteractive">
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
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js',new Date());
// Read stored consent so returning visitors who previously accepted analytics
// start GRANTED — the default must match the stored choice before gtag.js
// processes queued consent updates, otherwise the 'denied' default would
// overwrite an earlier 'granted' update and block all collection.
var storedConsent=null;
try{storedConsent=localStorage.getItem('${ANALYTICS_CONSENT_KEY}');}catch(e){}
var analyticsState=storedConsent==='granted'?'granted':'denied';
gtag('consent','default',{
  analytics_storage:analyticsState,
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
