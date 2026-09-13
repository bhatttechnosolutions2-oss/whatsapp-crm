import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const trackEndpoint = `${protocol}://${host}/api/v1/analytics/track`;

  const script = `
(function() {
  try {
    var scriptTag = document.currentScript || document.querySelector('script[data-org]') || document.querySelector('script[src*="analytics/script.js"]');
    var orgSlug = null;
    if (scriptTag) {
      orgSlug = scriptTag.getAttribute('data-org');
      if (!orgSlug && scriptTag.src) {
        var urlParams = new URL(scriptTag.src).searchParams;
        orgSlug = urlParams.get('org');
      }
    }

    if (!orgSlug) {
      console.warn('[CRM Analytics] Missing organization identifier (data-org or ?org=slug)');
      return;
    }

    function getVisitorId() {
      var vid = localStorage.getItem('_crm_vid');
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('_crm_vid', vid);
      }
      return vid;
    }

    function getSessionId() {
      var sid = sessionStorage.getItem('_crm_sid');
      if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        sessionStorage.setItem('_crm_sid', sid);
      }
      return sid;
    }

    function getUTM(param) {
      var params = new URLSearchParams(window.location.search);
      return params.get(param) || null;
    }

    var visitorId = getVisitorId();
    var sessionId = getSessionId();
    var startTime = Date.now();

    function sendBeacon(isHeartbeat, eventName, eventData) {
      var duration = Math.round((Date.now() - startTime) / 1000);
      var payload = {
        orgSlug: orgSlug,
        visitorId: visitorId,
        sessionId: sessionId,
        url: window.location.pathname + window.location.search,
        title: document.title,
        referrer: document.referrer || null,
        utmSource: getUTM('utm_source'),
        utmMedium: getUTM('utm_medium'),
        utmCampaign: getUTM('utm_campaign'),
        durationSeconds: duration,
        isHeartbeat: !!isHeartbeat,
        eventName: eventName || null,
        eventData: eventData || null,
        screen: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      var data = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon("${trackEndpoint}", data);
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "${trackEndpoint}", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);
      }
    }

    // 1. Initial Page View Track
    sendBeacon(false);

    // 2. 25-sec Heartbeat to keep live visitor status active
    var heartbeatInterval = setInterval(function() {
      sendBeacon(true);
    }, 25000);

    // 3. Auto-track WhatsApp clicks
    document.addEventListener('click', function(e) {
      var target = e.target.closest('a');
      if (target && target.href && (target.href.indexOf('wa.me') !== -1 || target.href.indexOf('whatsapp.com') !== -1)) {
        sendBeacon(false, 'whatsapp_click', { href: target.href });
      }
    });

    // 4. Page leave beacon
    window.addEventListener('beforeunload', function() {
      clearInterval(heartbeatInterval);
      sendBeacon(true);
    });

    // 5. SPA Route Change Listeners
    var lastUrl = location.href;
    new MutationObserver(function() {
      var url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        startTime = Date.now();
        sendBeacon(false);
      }
    }).observe(document, { subtree: true, childList: true });

  } catch(err) {
    // Fail silently in browser
  }
})();
`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
