"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, moved: false });
  const activeRef = useRef(true);

  useEffect(() => {
    // Disable on touch screens
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 12;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.moved = true;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Pause when tab loses focus
    const onVisibilityChange = () => {
      activeRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const spawnParticle = (x: number, y: number) => {
      if (particles.length >= maxParticles) return;
      
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.35 + 0.1;
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.15,
        alpha: 0.55,
        size: Math.random() * 2 + 1,
        life: 250,
        maxLife: 250,
      });
    };

    let lastTime = performance.now();

    const loop = (now: number) => {
      animationFrameId = requestAnimationFrame(loop);

      if (!activeRef.current) return;

      const dt = now - lastTime;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mouseRef.current.moved) {
        spawnParticle(mouseRef.current.x, mouseRef.current.y);
        mouseRef.current.moved = false;
      }

      particles = particles.filter((p) => {
        p.life -= dt;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, p.life / p.maxLife) * 0.55;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
        ctx.fill();

        return true;
      });
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 mix-blend-screen"
      style={{ willChange: "transform" }}
    />
  );
}
