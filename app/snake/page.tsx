"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 22;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED_MS = 140;
const MIN_SPEED_MS = 70;
const SPEED_STEP_MS = 4;
const BEST_SCORE_KEY = "snake-best-score";

const SNAKE_GREEN_OUTLINE = "#2f8f52";
const SNAKE_TEAL_SPOT = "#3ec1c9";
const SNAKE_BELLY_CREAM = "#f7e9c9";
const SNAKE_BELLY_RIB = "#e2c78e";
const SNAKE_CHEEK_PINK = "rgba(255,173,190,0.55)";

const DIRECTIONS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};

function createInitialSnake(): Point[] {
  const y = Math.floor(GRID_SIZE / 2);
  return [
    { x: 8, y },
    { x: 7, y },
    { x: 6, y },
  ];
}

function randomFood(snake: Point[]): Point {
  const free: Point[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)];
}

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>(createInitialSnake());
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const pendingDirectionRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>(randomFood(createInitialSnake()));
  const speedRef = useRef(INITIAL_SPEED_MS);
  const scoreRef = useRef(0);
  const bestScoreRef = useRef(0);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BEST_SCORE_KEY);
      const parsed = raw ? Number(raw) : 0;
      if (parsed > 0) {
        bestScoreRef.current = parsed;
        setBestScore(parsed);
      }
    } catch {
      // ignore environments without localStorage
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    const food = foodRef.current;
    ctx.fillStyle = "#f87171";
    ctx.shadowColor = "#f87171";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    const snake = snakeRef.current;

    // body: draw tail-to-head so overlaps look continuous, each segment is a
    // little green blob with a cream ribbed belly stripe + occasional teal spot
    for (let i = snake.length - 1; i >= 1; i--) {
      const segment = snake[i];
      const neighbor = i < snake.length - 1 ? snake[i + 1] : snake[i - 1];
      let dx = segment.x - neighbor.x;
      let dy = segment.y - neighbor.y;
      if (dx === 0 && dy === 0) {
        dx = directionRef.current.x;
        dy = directionRef.current.y;
      }
      const angle = Math.atan2(dy, dx);
      const cx = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const r = CELL_SIZE * 0.46;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = "#8be6a4";
      ctx.fillRect(-r, -r, r * 2, r * 2);

      ctx.rotate(angle);
      const stripeH = r * 0.85;
      ctx.fillStyle = SNAKE_BELLY_CREAM;
      ctx.fillRect(-r * 1.2, -stripeH / 2, r * 2.4, stripeH);
      ctx.strokeStyle = SNAKE_BELLY_RIB;
      ctx.lineWidth = 1;
      for (let rib = -r; rib <= r; rib += r * 0.5) {
        ctx.beginPath();
        ctx.moveTo(rib, -stripeH / 2);
        ctx.lineTo(rib, stripeH / 2);
        ctx.stroke();
      }
      ctx.rotate(-angle);

      if (i % 3 === 0) {
        ctx.fillStyle = SNAKE_TEAL_SPOT;
        ctx.beginPath();
        ctx.ellipse(-r * 0.15, -r * 0.55, r * 0.28, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      ctx.strokeStyle = SNAKE_GREEN_OUTLINE;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // head: a big round cute face with spots on top, blush cheeks, and big
    // forward-looking eyes, rotated to face the current travel direction
    if (snake.length > 0) {
      const head = snake[0];
      const cx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = head.y * CELL_SIZE + CELL_SIZE / 2;
      const R = CELL_SIZE * 0.62;
      const angle = Math.atan2(directionRef.current.y, directionRef.current.x);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const gradient = ctx.createRadialGradient(
        -R * 0.2,
        -R * 0.2,
        R * 0.1,
        0,
        0,
        R,
      );
      gradient.addColorStop(0, "#b6f5c6");
      gradient.addColorStop(1, "#5fd482");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = SNAKE_GREEN_OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = SNAKE_TEAL_SPOT;
      [
        [-R * 0.35, -R * 0.45, R * 0.16],
        [-R * 0.05, -R * 0.6, R * 0.12],
        [-R * 0.5, 0, R * 0.13],
      ].forEach(([ox, oy, rr]) => {
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr, rr * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = SNAKE_CHEEK_PINK;
      [1, -1].forEach((sign) => {
        ctx.beginPath();
        ctx.ellipse(
          R * 0.05,
          R * 0.48 * sign,
          R * 0.22,
          R * 0.16,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      const eyeR = R * 0.34;
      [1, -1].forEach((sign) => {
        const ex = R * 0.22;
        const ey = R * 0.4 * sign;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#1e3a8a";
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.25, ey, eyeR * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.3, ey, eyeR * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.05, ey - eyeR * 0.35, eyeR * 0.18, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(R * 0.55, -R * 0.08);
      ctx.quadraticCurveTo(R * 0.68, 0, R * 0.55, R * 0.08);
      ctx.stroke();

      ctx.restore();
    }
  }, []);

  useEffect(() => {
    draw();
  }, [draw]);

  const endGame = useCallback(() => {
    setGameOver(true);
    setStarted(false);
    if (scoreRef.current > bestScoreRef.current) {
      bestScoreRef.current = scoreRef.current;
      setBestScore(scoreRef.current);
      try {
        localStorage.setItem(BEST_SCORE_KEY, String(scoreRef.current));
      } catch {
        // ignore environments without localStorage
      }
    }
  }, []);

  const tick = useCallback(() => {
    directionRef.current = pendingDirectionRef.current;
    const body = snakeRef.current;
    const head = body[0];
    const newHead: Point = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y,
    };

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      endGame();
      return;
    }

    const willEat =
      newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    const bodyToCheck = willEat ? body : body.slice(0, -1);
    if (bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      endGame();
      return;
    }

    const newSnake = [newHead, ...body];
    if (willEat) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      foodRef.current = randomFood(newSnake);
      speedRef.current = Math.max(
        MIN_SPEED_MS,
        speedRef.current - SPEED_STEP_MS,
      );
    } else {
      newSnake.pop();
    }
    snakeRef.current = newSnake;
    draw();
  }, [draw, endGame]);

  useEffect(() => {
    if (!started || paused || gameOver) return;
    let rafId: number;
    let last = performance.now();
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (now - last >= speedRef.current) {
        last = now;
        tick();
      }
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [started, paused, gameOver, tick]);

  const startGame = useCallback(() => {
    const initial = createInitialSnake();
    snakeRef.current = initial;
    directionRef.current = { x: 1, y: 0 };
    pendingDirectionRef.current = { x: 1, y: 0 };
    foodRef.current = randomFood(initial);
    speedRef.current = INITIAL_SPEED_MS;
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setStarted(true);
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (started && !gameOver) setPaused((p) => !p);
        return;
      }
      const dir = DIRECTIONS[e.key];
      if (!dir || !started || gameOver) return;
      e.preventDefault();
      const current = directionRef.current;
      if (dir.x === -current.x && dir.y === -current.y) return;
      pendingDirectionRef.current = dir;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#060a14] px-6 py-12 text-white">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="text-sm text-emerald-300/70 transition-colors hover:text-emerald-200"
        >
          ← 返回首頁
        </Link>

        <div className="mt-4 flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-wide">🐍 貪吃蛇</h1>
          <p className="mt-1 text-sm text-emerald-100/60">
            用方向鍵或 WASD 控制蛇的移動，吃到食物會變長，撞牆或咬到自己就結束
          </p>

          <div className="mt-5 flex items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 font-semibold text-emerald-300">
              分數：{score}
            </span>
            <span className="rounded-full bg-amber-500/10 px-4 py-1.5 font-semibold text-amber-300">
              最高分：{bestScore}
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-6 w-fit">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-2xl border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
          />

          {(!started || gameOver) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/70 backdrop-blur-sm">
              {gameOver && (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">遊戲結束</p>
                  <p className="mt-1 text-sm text-white/70">
                    本次分數：{score}
                  </p>
                </div>
              )}
              <button
                onClick={startGame}
                className="rounded-full bg-emerald-400 px-8 py-3 text-sm font-bold text-emerald-950 shadow-lg transition-colors hover:bg-emerald-300"
              >
                {gameOver ? "再玩一次" : "開始遊戲"}
              </button>
            </div>
          )}

          {started && !gameOver && paused && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
              <p className="text-lg font-bold text-white">已暫停</p>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-emerald-100/40">
          按空白鍵可暫停／繼續
        </p>
      </div>
    </main>
  );
}
