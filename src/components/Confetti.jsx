import { useEffect, useRef } from 'react';

export default function Confetti({ duration = 4000 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Confetti pieces
    const colors = [
      '#10b981', // emerald
      '#059669', // dark emerald
      '#34d399', // light emerald
      '#fbbf24', // amber/gold
      '#f59e0b', // warm gold
      '#14b8a6', // teal
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
    ];

    const pieces = Array.from({ length: 110 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * -height * 0.5,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2.5,
      speedX: Math.random() * 4 - 2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 6 - 3,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.random() * 0.05 + 0.02,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      opacity: 1,
    }));

    let animationFrameId;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      // Fade out near the end
      const remaining = duration - elapsed;
      const globalAlpha = remaining < 1000 ? Math.max(0, remaining / 1000) : 1;

      pieces.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.wobble) * 1.5 + p.speedX * 0.5;
        p.wobble += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.globalAlpha = p.opacity * globalAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
