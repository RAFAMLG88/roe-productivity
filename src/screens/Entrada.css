/* ═══ ENTRADA — a portaria da ROE City à noite ═══
   Antes de entrares, a cidade dorme. O login é o amanhecer. */

.entrada{position:fixed;inset:0;z-index:10;display:grid;place-items:center;overflow:hidden;
  background:
    radial-gradient(120% 90% at 50% 110%, rgba(255,206,10,.10) 0%, rgba(255,206,10,0) 46%),
    linear-gradient(180deg,#0b0a10 0%,#12100a 58%,#141207 100%)}

/* estrelas — as mesmas da noite do santuário, em dose contida */
.ent-stars{position:absolute;inset:0;pointer-events:none}
.ent-stars span{position:absolute;width:2px;height:2px;border-radius:50%;background:#F4EEE0;
  animation:entTwinkle 6s ease-in-out infinite}
@keyframes entTwinkle{0%,100%{opacity:.15}50%{opacity:.7}}

/* skyline no horizonte, janelas âmbar a acender/apagar */
.ent-skyline{position:absolute;left:0;right:0;bottom:0;width:100%;height:22vh;min-height:120px;opacity:.9}
.ent-win{animation:entWin 9s ease-in-out infinite;opacity:.12}
@keyframes entWin{0%,100%{opacity:.10}12%{opacity:.85}30%{opacity:.85}44%{opacity:.10}}

/* a portaria — o único ponto iluminado */
.ent-card{position:relative;z-index:2;width:400px;max-width:92vw;background:var(--cream);
  border-radius:26px;padding:30px 30px 22px;
  box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,206,10,.22),0 0 90px rgba(255,206,10,.07);
  animation:entRise .7s cubic-bezier(.2,.8,.2,1) both}
@keyframes entRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}

.ent-brand{display:flex;align-items:center;gap:14px}
.ent-bt{font-family:var(--font-display);font-weight:600;font-size:24px;line-height:1;color:var(--black)}
.ent-bs{font-size:9px;font-family:var(--font-mono);letter-spacing:.2em;text-transform:uppercase;color:var(--soft);margin-top:4px}
.ent-tag{margin:14px 0 16px;font-family:var(--font-display);font-weight:500;font-size:15px;color:var(--ink)}

.ent-tabs{display:flex;gap:4px;background:var(--cream-2);border:1px solid var(--line);border-radius:13px;padding:4px;margin-bottom:16px}
.ent-tabs button{flex:1;border:none;background:none;padding:9px 0;border-radius:10px;cursor:pointer;
  font-family:var(--font-body);font-weight:700;font-size:12.5px;color:var(--soft);transition:all .25s}
.ent-tabs button.on{background:var(--black);color:var(--cream);box-shadow:0 4px 12px rgba(20,18,7,.28)}

.ent-field{display:block;margin-bottom:12px}
.ent-field span{display:block;font-size:9.5px;font-family:var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--soft);margin-bottom:5px}
.ent-field input{width:100%;border:1.5px solid var(--line);border-radius:12px;background:#fff;
  padding:11px 13px;font-family:var(--font-body);font-weight:600;font-size:14px;color:var(--ink);outline:none;
  transition:border-color .2s,box-shadow .2s}
.ent-field input::placeholder{color:var(--faint);font-weight:500}
.ent-field input:focus{border-color:var(--mustard);box-shadow:0 0 0 3px rgba(255,206,10,.22)}
.ent-convite{font-family:var(--font-mono)!important;letter-spacing:.18em;text-transform:uppercase}

.ent-erro{background:var(--red-soft);border:1px solid rgba(255,31,61,.25);color:var(--red-ink);
  border-radius:12px;padding:10px 13px;font-size:12.5px;font-weight:600;margin-bottom:12px}

.ent-go{width:100%;border:none;cursor:pointer;background:var(--black);color:var(--cream);
  border-radius:14px;padding:14px 0;font-family:var(--font-display);font-weight:600;font-size:15px;
  transition:transform .2s,box-shadow .2s,opacity .2s;box-shadow:0 10px 26px rgba(20,18,7,.35)}
.ent-go:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 32px rgba(20,18,7,.42)}
.ent-go:disabled{opacity:.6;cursor:default}
.ent-go:focus-visible,.ent-tabs button:focus-visible{outline:2px solid var(--mustard);outline-offset:2px}

.ent-foot{margin-top:14px;text-align:center;font-size:9px;font-family:var(--font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}

@media (max-height:640px){.ent-card{padding:22px 24px 16px}.ent-tag{margin:10px 0 12px}}
