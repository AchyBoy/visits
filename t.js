/* Visit tracker for Andrew's sites on achyboy.github.io. Include with:
   <script src="/visits/t.js" defer></script>
   Logs a page view, taps on call / directions / social links, anything the
   page reports with track(kind, detail), and time on page when it closes.
   Viewer: achyboy.github.io/visits (private key). No cookies, no raw IP. */
(function(){
  if (window.__trk) return; window.__trk = 1;
  var API = 'https://api.jobhubgo.com/api/site-visits/hit';
  var cs = document.currentScript;
  var site = (cs && cs.dataset.site) || location.pathname.split('/')[1] || 'home';
  function id(k, st){ try{ var v=st.getItem(k); if(!v){ v=Math.random().toString(36).slice(2,9)+Date.now().toString(36); st.setItem(k,v) } return v }catch(e){ return null } }
  var vid = id('trk-vid', localStorage), sid = id('trk-sid-'+site, sessionStorage);
  var me = false; try{ me = localStorage.getItem('trk-me')==='1' }catch(e){}
  // keep where they came from, even across the fresh-build hop (same-origin reload)
  var ref = document.referrer || '';
  try{
    if (ref && ref.indexOf(location.origin+'/'+site)!==0) sessionStorage.setItem('trk-ref-'+site, ref);
    ref = sessionStorage.getItem('trk-ref-'+site) || (ref.indexOf(location.origin+'/'+site)===0 ? '' : ref);
  }catch(e){}
  function path(){ var u=new URL(location.href); u.searchParams.delete('v'); return u.pathname+u.search }
  function send(kind, detail){
    var b = { site:site, vid:vid, sid:sid, kind:kind, detail:detail==null?null:String(detail).slice(0,200), path:path(), ref:ref,
      w:screen.width, h:screen.height, dpr:window.devicePixelRatio||1, lang:navigator.language, me:me };
    try{ b.tz = Intl.DateTimeFormat().resolvedOptions().timeZone }catch(e){}
    try{ fetch(API, { method:'POST', body:JSON.stringify(b), keepalive:true, mode:'cors', headers:{'Content-Type':'text/plain'} }).catch(function(){}) }catch(e){}
  }
  window.track = function(kind, detail){ send(kind, detail) };

  // The view waits until the page's fresh-build check is done (window.__freshPending,
  // set by the site's head script). If that check hops to a newer build, this page
  // unloads first and only the new page counts. On slow cell data it can take >1s.
  var viewTimer, waited = 0;
  (function tryView(){
    if (window.__freshPending === true && waited < 8000){ waited += 250; viewTimer = setTimeout(tryView, 250); return; }
    viewTimer = setTimeout(function(){ send('view', document.title) }, waited ? 300 : 800);
  })();
  addEventListener('pagehide', function(){ clearTimeout(viewTimer) });

  // taps worth knowing about
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '', t = (a.textContent||'').trim().replace(/\s+/g,' ').slice(0,80);
    if (/^tel:/.test(h)) send('call', h.slice(4));
    else if (/^mailto:/.test(h)) send('email', h.slice(7));
    else if (/maps\.apple\.com|google\.[a-z.]+\/maps|maps\.google/.test(h)) {
      var near = a.closest('.stop,.panel,li,div'); var nm = near && near.querySelector('b');
      send('directions', (nm ? nm.textContent.trim()+' · ' : '') + t);
    }
    else if (/facebook\.com/.test(h)) send('facebook', t);
    else if (/instagram\.com/.test(h)) send('instagram', t);
    else if (/^#/.test(h)) send('nav', t || h);
    else if (/^https?:/.test(h)) send('link', h);
  }, true);

  // time actually looking at the page, and how far down they got
  var shown = document.visibilityState==='visible' ? Date.now() : 0, seen = 0, maxPct = 0, lastLeave = -1;
  function depth(){ var d=document.documentElement, p=Math.round(100*(scrollY+innerHeight)/Math.max(1,d.scrollHeight)); if(p>maxPct) maxPct=Math.min(100,p) }
  addEventListener('scroll', depth, {passive:true}); depth();
  function bye(){
    if (shown){ seen += Date.now()-shown; shown = 0 }
    var secs = Math.round(seen/1000);
    if (seen > 1500 && secs !== lastLeave){ lastLeave = secs; send('leave', secs+'s|'+maxPct+'%'); }
  }
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState==='hidden') bye(); else shown = Date.now();
  });
  addEventListener('pagehide', function(){ if (shown) bye() });
})();
