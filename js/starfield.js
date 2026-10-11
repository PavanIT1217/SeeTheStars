// Animated deep-space background: twinkling stars drifting slowly, with the occasional shooting star.
export function startStarfield(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [];
  let meteor = null;
  let W = 0, H = 0, raf = 0, paused = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((W * H) / 3500);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() < 0.08 ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.8,
      tw: Math.random() * Math.PI * 2, sp: 0.5 + Math.random() * 1.5,
      depth: 0.2 + Math.random() * 0.8,
      hue: [210, 40, 0, 200, 260][Math.floor(Math.random() * 5)],
    }));
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (paused) return;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      if (!reduced) {
        s.x -= 0.02 * s.depth;
        if (s.x < -2) s.x = W + 2;
      }
      const a = reduced ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(s.tw + (t / 1000) * s.sp));
      ctx.fillStyle = `hsla(${s.hue}, 80%, ${s.r > 1 ? 88 : 96}%, ${a * s.depth})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduced) {
      if (!meteor && Math.random() < 0.002) meteor = { x: Math.random() * W, y: Math.random() * H * 0.5, vx: -6 - Math.random() * 4, vy: 3 + Math.random() * 2, life: 1 };
      if (meteor) {
        const g = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12);
        g.addColorStop(0, `rgba(255,255,255,${meteor.life})`);
        g.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12);
        ctx.stroke();
        meteor.x += meteor.vx; meteor.y += meteor.vy; meteor.life -= 0.015;
        if (meteor.life <= 0) meteor = null;
      }
    }
  }

  window.addEventListener('resize', resize);
  resize();
  raf = requestAnimationFrame(frame);
  return {
    pause(v) { paused = v; if (v) ctx.clearRect(0, 0, W, H); },
    stop() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}
