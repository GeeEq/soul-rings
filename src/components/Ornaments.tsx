import React, { useEffect, useRef } from "react";

export interface OrnamentProps {
  size?: number; // overall bounding height in px
  color?: string; // neon color
  glow?: number; // shadowBlur
  rotation?: number; // radians
  pulse?: boolean; // subtle pulsing animation
}

/**
 * Programmatic ornament/sigil component drawn on canvas.
 * Designed to be placed on top of a mandala ring (rotate/translate externally).
 */
const Ornament: React.FC<OrnamentProps> = ({
  size = 160,
  color = "#ff02e6",
  glow = 28,
  rotation = 0,
  pulse = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef<number>(0);

  // helper: high-DPI resize
  function resizeCanvas(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.ceil(size * dpr);
    canvas.height = Math.ceil(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // neon stroke helper: stroke with glow + inner stroke for crispness
  function neonStroke(
    ctx: CanvasRenderingContext2D,
    path: () => void,
    opts: { w?: number; blur?: number; alpha?: number } = {}
  ) {
    const { w = 2.2, blur = glow, alpha = 1 } = opts;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalAlpha = alpha;

    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = w * 2.6;
    path();
    ctx.stroke();

    // crisp core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    path();
    ctx.stroke();

    ctx.restore();
  }

  // draw ornament centered at (0,0), oriented up (pointing to -Y). scale = 1 fits size.
  function drawOrnamentAt(ctx: CanvasRenderingContext2D, scale = 1) {
    ctx.save();
    ctx.scale(scale, scale);

    // Top petal crown: a crown of triangular petals
    ctx.beginPath();
    const crownRadius = 36;
    const crownCount = 7;
    for (let i = 0; i < crownCount; i++) {
      const a = (-Math.PI / 2) + (i - (crownCount - 1) / 2) * (Math.PI / 10);
      const tipX = Math.cos(a) * (crownRadius + 6);
      const tipY = Math.sin(a) * (crownRadius + 6) - 14;
      const baseLeftX = Math.cos(a - 0.12) * crownRadius;
      const baseLeftY = Math.sin(a - 0.12) * crownRadius - 8;
      const baseRightX = Math.cos(a + 0.12) * crownRadius;
      const baseRightY = Math.sin(a + 0.12) * crownRadius - 8;

      ctx.moveTo(baseLeftX, baseLeftY);
      ctx.quadraticCurveTo(tipX * 0.9, tipY * 0.9, tipX, tipY);
      ctx.quadraticCurveTo(tipX * 0.95, tipY * 0.95, baseRightX, baseRightY);
    }
    neonStroke(ctx, () => ctx.stroke(), { w: 2.2 });

    // Main outer oval frame around the mid section
    neonStroke(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(0, -2, 46, 64, 0, 0, Math.PI * 2);
    }, { w: 4, blur: glow * 1.02 });

    // Central vertical rod / spike
    neonStroke(ctx, () => {
      ctx.beginPath();
      ctx.moveTo(0, -72);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 8);
      ctx.lineTo(0, 52);
    }, { w: 3.2, blur: glow * 0.9 });

    // Small cross/loop in the middle (looks like a circlet)
    neonStroke(ctx, () => {
      ctx.beginPath();
      // horizontal crossbar near center
      ctx.moveTo(-18, 6);
      ctx.quadraticCurveTo(0, -2, 18, 6);
      // small circle intersection
      ctx.moveTo(0, 8);
      ctx.arc(0, 8, 12, 0, Math.PI * 2);
    }, { w: 2.0 });

    // Lower decorative double-circle & tear
    neonStroke(ctx, () => {
      ctx.beginPath();
      // upper small loop
      ctx.ellipse(0, 38, 14, 10, 0, 0, Math.PI * 2);
      // lower small loop (slightly offset)
      ctx.ellipse(0, 56, 10, 7, 0, 0, Math.PI * 2);

      // bottom teardrop / pendant
      ctx.moveTo(0, 66);
      ctx.bezierCurveTo(6, 76, 8, 86, 0, 92);
      ctx.bezierCurveTo(-8, 86, -6, 76, 0, 66);
    }, { w: 2.0 });

    // small inner accent dots
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, -18, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 34, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvas(canvas);

    // animation loop: supports optional pulse
    function frame(now: number) {
      tRef.current = now / 1000;
      const pulseFactor = pulse ? 0.965 + 0.035 * Math.sin(now / 250) : 1.0;

      // clear & center
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      // canvas is size x size in CSS px; center at mid
      const cssSize = size;
      ctx.translate(cssSize / 2, cssSize / 2 - 6); // slight upward bias to match reference
      ctx.rotate(rotation);
      // scale to fit: base design assumes ~160 height. scale to requested size with pulse
      const baseDesignHeight = 160;
      const scale = (size / baseDesignHeight) * pulseFactor;

      // draw outer soft halo (radial gradient)
      const g = ctx.createRadialGradient(0, -8, 6, 0, -8, Math.max(80, size * 0.7));
      g.addColorStop(0, `${color}22`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -8, 72 * scale, 98 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      drawOrnamentAt(ctx, scale);

      ctx.restore();
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    const onResize = () => {
      resizeCanvas(canvas);
    };
    window.addEventListener("resize", onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, color, glow, rotation, pulse]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "block",
        background: "transparent",
      }}
      // keeping pointer events none so it overlays safely in mandala composition
      width={Math.ceil(size * (window.devicePixelRatio || 1))}
      height={Math.ceil(size * (window.devicePixelRatio || 1))}
    />
  );
};

export default Ornament;
