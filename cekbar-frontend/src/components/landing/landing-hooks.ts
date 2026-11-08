import { useState, useEffect, useRef } from "react";

export const ANIMATION_STYLES = `
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lp-line-grow {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes lp-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-12px) rotate(2deg); }
  }
  @keyframes lp-float-rev {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50%       { transform: translateY(-10px) rotate(-2deg); }
  }
  @keyframes lp-pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.75); }
  }
  @keyframes lp-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes lp-blob {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50%       { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
  }
  @keyframes lp-gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes lp-pulse-badge {
    0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
    100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
  }

  .lp-float      { animation: lp-float     5s ease-in-out infinite; }
  .lp-float-rev  { animation: lp-float-rev 6s ease-in-out infinite; }
  .lp-blob       { animation: lp-blob      8s ease-in-out infinite; }

  .lp-card {
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  }
  .lp-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 48px -12px rgba(37,99,235,0.15);
    border-color: #93c5fd;
  }

  .lp-connector {
    background: linear-gradient(90deg, #bfdbfe 0%, #3B82F6 50%, #bfdbfe 100%);
    background-size: 200% auto;
    animation: lp-shimmer 2.5s linear infinite;
  }

  .lp-progress {
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    background: linear-gradient(90deg, #1D4ED8, #60a5fa, #1D4ED8);
    background-size: 200% auto;
    animation: lp-shimmer 2s linear infinite;
    z-index: 100;
    transition: width 0.1s linear;
  }

  .lp-heading-line::after {
    content: '';
    display: block;
    height: 3px;
    background: linear-gradient(90deg, #1D4ED8, #60a5fa);
    border-radius: 4px;
    margin-top: 10px;
    width: 0;
    transition: width 0.7s cubic-bezier(.22,.68,0,1.1) 0.2s;
  }
  .lp-heading-line.lp-visible::after { width: 56px; }

  .lp-gradient-text {
    background: linear-gradient(135deg, #93c5fd, #60a5fa, #38bdf8, #93c5fd);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lp-gradient-x 4s ease infinite;
  }

  .lp-badge-glow { animation: lp-pulse-badge 2.5s infinite; }

  .lp-icon-glow { transition: box-shadow 0.25s ease; }
  .lp-icon-glow:hover { box-shadow: 0 8px 24px -4px rgba(37,99,235,0.5); }
`;

export function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function useCounter(target: number, duration = 1400, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);
  return count;
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      setProgress(doc.scrollHeight - doc.clientHeight > 0
        ? (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}
