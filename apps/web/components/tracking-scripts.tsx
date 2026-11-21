import Script from "next/script";
import {
  isFacebookPixelId,
  isGa4Id,
  isGoogleAdsId,
  isGtmId,
  isTiktokPixelId,
} from "@/lib/seo";

export function TrackingScripts({
  gtmId,
  ga4Id,
  googleAdsId,
  facebookPixelId,
  tiktokPixelId,
}: {
  gtmId: string;
  ga4Id: string;
  googleAdsId: string;
  facebookPixelId: string;
  tiktokPixelId: string;
}) {
  const gtm = isGtmId(gtmId) ? gtmId.trim().toUpperCase() : "";
  const ga4 = isGa4Id(ga4Id) ? ga4Id.trim() : "";
  const ads = isGoogleAdsId(googleAdsId) ? googleAdsId.trim() : "";
  const fb = !gtm && isFacebookPixelId(facebookPixelId) ? facebookPixelId.trim() : "";
  const tt = !gtm && isTiktokPixelId(tiktokPixelId) ? tiktokPixelId.trim() : "";
  const gtagIds = [ga4, ads].filter(Boolean);

  return (
    <>
      {gtm ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());`}
        </Script>
      ) : null}
      {gtagIds.length > 0 ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gtagIds.map((id) => `gtag('config','${id}');`).join("")}`}
          </Script>
        </>
      ) : null}
      {fb ? (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb}');fbq('track','PageView');`}
        </Script>
      ) : null}
      {tt ? (
        <Script id="tt-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tt}');ttq.page();}(window, document, 'ttq');`}
        </Script>
      ) : null}
    </>
  );
}

export function TrackingNoscript({ gtmId }: { gtmId: string }) {
  const gtm = isGtmId(gtmId) ? gtmId.trim().toUpperCase() : "";
  if (!gtm) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
