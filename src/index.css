:root{
  --cream:#F4EEE0; --cream-2:#ECE4D2; --card:#FFFFFF; --line:#E8DECB;
  --black:#141207; --ink:#211E14; --soft:#7C7466; --faint:#ADA590;
  --red:#FF1F3D; --forest:#00C865; --mustard:#FFCE0A; --sky:#1FB8E0;
  --red-soft:#FFF0F2; --forest-soft:#EBFCF3; --mustard-soft:#FFFBE6; --sky-soft:#EAF7FC;
  --red-ink:#D81030; --forest-ink:#00A352; --mustard-ink:#B89400; --sky-ink:#1496C4;
  --font-display:'Fredoka',sans-serif; --font-body:'Quicksand',sans-serif; --font-mono:'JetBrains Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{background:var(--cream);font-family:var(--font-body);font-weight:500;-webkit-font-smoothing:antialiased;color:var(--ink)}

/* ── SHELL ── */
.app{display:flex;height:100%;overflow:hidden;position:relative}
.bg-blob{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
.bb1{width:480px;height:480px;background:rgba(255,206,10,.13);top:-140px;right:-90px}
.bb2{width:410px;height:410px;background:rgba(0,200,101,.08);bottom:-130px;left:260px}

/* ── SIDEBAR ── */
.side{width:232px;flex:none;background:var(--black);display:flex;flex-direction:column;padding:26px 16px 20px;position:relative;z-index:3}
.brand{display:flex;align-items:center;gap:12px;padding:0 8px 26px;cursor:default}
.brand .logo{width:40px;height:40px;border-radius:12px;background:var(--mustard);display:grid;place-items:center;color:var(--black);font-family:var(--font-display);font-weight:700;font-size:20px;box-shadow:0 4px 14px rgba(255,206,10,.3)}
.brand .bt{font-family:var(--font-display);font-weight:600;font-size:16px;color:var(--cream);line-height:1}
.brand .bs{font-size:8px;font-family:var(--font-mono);letter-spacing:.16em;text-transform:uppercase;color:#6a6356;margin-top:3px}
.nav{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.nav button{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:12px;color:#8a8272;font-size:13px;font-weight:600;cursor:pointer;transition:all .25s;font-family:var(--font-body);border:none;background:none;text-align:left;width:100%}
.nav button .ic{font-size:16px;width:20px;text-align:center}
.nav button:hover{background:rgba(255,255,255,.05);color:var(--cream)}
.nav button.on{background:rgba(255,206,10,.14);color:var(--mustard)}
.nav button .num{margin-left:auto;font-size:9px;font-family:var(--font-mono);background:var(--red);color:#fff;border-radius:10px;padding:1px 7px}
.side .foot{margin-top:auto;display:flex;align-items:center;gap:11px;padding:12px 10px;border-top:1px solid #262218}
.side .foot .av{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--mustard),#E5B400);display:grid;place-items:center;color:var(--black);font-family:var(--font-display);font-weight:700;font-size:14px}
.side .foot .fn{font-size:12px;color:var(--cream);font-weight:600}
.side .foot .fs{font-size:9px;font-family:var(--font-mono);color:#6a6356}

/* ── MAIN / TOPBAR ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:1}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:20px 30px 0}
.topbar .l1{font-size:10px;font-family:var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.topbar .l2{font-family:var(--font-display);font-size:26px;font-weight:600;margin-top:2px}

/* ── PAINÉIS (partilhado) ── */
.panel{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:0 8px 24px rgba(60,50,30,.05);transition:transform .3s,box-shadow .3s}
.panel:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(60,50,30,.09)}
.panel.enter{opacity:0;transform:translateY(14px);animation:enter .55s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes enter{to{opacity:1;transform:none}}
.pt{font-family:var(--font-display);font-size:14px;font-weight:600;margin-bottom:13px;display:flex;align-items:center;gap:9px}
.pt .pico{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;font-size:14px}

@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}.panel.enter{opacity:1;transform:none}}
