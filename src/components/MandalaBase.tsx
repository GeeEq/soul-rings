import React, { useEffect, useRef } from "react";

const MandalaBase: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const center = () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
    });

    // Function to draw the glowing inner ring (filled aura ring)
    const drawGlowingRing = (
      x: number,
      y: number,
      radius: number,
      thickness: number,
      color: string
    ) => {
      const innerRadius = radius - thickness / 2;
      const outerRadius = radius + thickness / 2;

      const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.4, `${color}80`); // mid aura
      gradient.addColorStop(0.5, color); // bright edge
      gradient.addColorStop(0.6, `${color}80`);
      gradient.addColorStop(1, "transparent");

      ctx.save();
      ctx.globalCompositeOperation = "lighter"; // additive blending
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Basic helper for other circles
    const drawCircle = (
      x: number,
      y: number,
      radius: number,
      options: {
        color?: string;
        lineWidth?: number;
        dotted?: boolean;
        dotCount?: number;
      }
    ) => {
      const { color = "#ff00ff", lineWidth = 2, dotted = false, dotCount = 120 } = options;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      if (dotted) {
        const angleStep = (Math.PI * 2) / dotCount;
        for (let i = 0; i < dotCount; i++) {
          const angle = i * angleStep;
          const dotX = x + Math.cos(angle) * radius;
          const dotY = y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    const render = () => {
      const { x, y } = center();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // INNER glowing ring (pure light)
      drawGlowingRing(x, y, 170, 60, "#ff00ff");

      // MIDDLE solid bright ring
      drawCircle(x, y, 200, {
        color: "#ff66ff",
        lineWidth: 4,
      });

      // OUTER dotted ring
      drawCircle(x, y, 230, {
        color: "#ff00ff",
        dotted: true,
        dotCount: 160,
      });

      requestAnimationFrame(render);
    };

    render();

    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{
        background: "black",
        display: "block",
      }}
    />
  );
};

export default MandalaBase;
