"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};
type Status = "playing" | "won" | "lost";
type Difficulty = "beginner" | "intermediate" | "expert";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { rows: number; cols: number; mines: number; label: string }
> = {
  beginner: { rows: 9, cols: 9, mines: 10, label: "初級 9×9" },
  intermediate: { rows: 16, cols: 16, mines: 40, label: "中級 16×16" },
  expert: { rows: 16, cols: 30, mines: 99, label: "高級 16×30" },
};

const NUMBER_COLORS: Record<number, string> = {
  1: "#60a5fa",
  2: "#4ade80",
  3: "#f87171",
  4: "#a78bfa",
  5: "#fb923c",
  6: "#22d3ee",
  7: "#e5e7eb",
  8: "#9ca3af",
};

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function neighborsOf(
  r: number,
  c: number,
  rows: number,
  cols: number,
): [number, number][] {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) result.push([nr, nc]);
    }
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): Cell => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  );
}

function placeMines(
  rows: number,
  cols: number,
  mines: number,
  excludeR: number,
  excludeC: number,
): Cell[][] {
  const board = createEmptyBoard(rows, cols);
  const excluded = new Set<string>([cellKey(excludeR, excludeC)]);
  neighborsOf(excludeR, excludeC, rows, cols).forEach(([r, c]) =>
    excluded.add(cellKey(r, c)),
  );

  const safeCandidates: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!excluded.has(cellKey(r, c))) safeCandidates.push([r, c]);
    }
  }

  const pool =
    safeCandidates.length >= mines
      ? safeCandidates
      : (() => {
          const fallback: [number, number][] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (!(r === excludeR && c === excludeC)) fallback.push([r, c]);
            }
          }
          return fallback;
        })();

  shuffle(pool)
    .slice(0, mines)
    .forEach(([r, c]) => {
      board[r][c].mine = true;
    });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      board[r][c].adjacent = neighborsOf(r, c, rows, cols).filter(
        ([nr, nc]) => board[nr][nc].mine,
      ).length;
    }
  }

  return board;
}

function revealCell(
  board: Cell[][],
  rows: number,
  cols: number,
  r: number,
  c: number,
): { board: Cell[][]; hitMine: boolean } {
  const next = board.map((row) => row.map((cell) => ({ ...cell })));
  if (next[r][c].revealed || next[r][c].flagged) {
    return { board: next, hitMine: false };
  }

  if (next[r][c].mine) {
    next[r][c].revealed = true;
    return { board: next, hitMine: true };
  }

  const queue: [number, number][] = [[r, c]];
  const seen = new Set<string>([cellKey(r, c)]);
  while (queue.length > 0) {
    const [cr, cc] = queue.shift()!;
    next[cr][cc].revealed = true;
    if (next[cr][cc].adjacent === 0) {
      for (const [nr, nc] of neighborsOf(cr, cc, rows, cols)) {
        const key = cellKey(nr, nc);
        if (seen.has(key)) continue;
        seen.add(key);
        if (next[nr][nc].revealed || next[nr][nc].flagged || next[nr][nc].mine)
          continue;
        queue.push([nr, nc]);
      }
    }
  }
  return { board: next, hitMine: false };
}

function chordReveal(
  board: Cell[][],
  rows: number,
  cols: number,
  r: number,
  c: number,
): { board: Cell[][]; hitMine: boolean } {
  const cell = board[r][c];
  if (!cell.revealed || cell.adjacent === 0) return { board, hitMine: false };

  const neighbors = neighborsOf(r, c, rows, cols);
  const flaggedCount = neighbors.filter(([nr, nc]) => board[nr][nc].flagged).length;
  if (flaggedCount !== cell.adjacent) return { board, hitMine: false };

  let current = board;
  let hitMine = false;
  for (const [nr, nc] of neighbors) {
    if (current[nr][nc].flagged || current[nr][nc].revealed) continue;
    const result = revealCell(current, rows, cols, nr, nc);
    current = result.board;
    if (result.hitMine) hitMine = true;
  }
  return { board: current, hitMine };
}

export default function MinesweeperPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const config = DIFFICULTY_CONFIG[difficulty];

  const [board, setBoard] = useState<Cell[][]>(() =>
    createEmptyBoard(config.rows, config.cols),
  );
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<Status>("playing");
  const [seconds, setSeconds] = useState(0);
  const [explodedCell, setExplodedCell] = useState<{ r: number; c: number } | null>(
    null,
  );

  useEffect(() => {
    if (!started || status !== "playing") return;
    const id = setInterval(() => setSeconds((s) => Math.min(999, s + 1)), 1000);
    return () => clearInterval(id);
  }, [started, status]);

  function resetGame(nextDifficulty: Difficulty = difficulty) {
    const cfg = DIFFICULTY_CONFIG[nextDifficulty];
    setDifficulty(nextDifficulty);
    setBoard(createEmptyBoard(cfg.rows, cfg.cols));
    setStarted(false);
    setStatus("playing");
    setSeconds(0);
    setExplodedCell(null);
  }

  function finishLoss(b: Cell[][], r: number, c: number) {
    const revealedAll = b.map((row) =>
      row.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell)),
    );
    setBoard(revealedAll);
    setExplodedCell({ r, c });
    setStatus("lost");
  }

  function checkWin(b: Cell[][]) {
    const totalSafe = config.rows * config.cols - config.mines;
    let revealedSafe = 0;
    for (const row of b) {
      for (const cell of row) {
        if (cell.revealed && !cell.mine) revealedSafe++;
      }
    }
    if (revealedSafe === totalSafe) {
      const flaggedAll = b.map((row) =>
        row.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell)),
      );
      setBoard(flaggedAll);
      setStatus("won");
    }
  }

  function handleCellClick(r: number, c: number) {
    if (status !== "playing") return;
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (!started) {
      const freshBoard = placeMines(config.rows, config.cols, config.mines, r, c);
      const { board: revealedBoard, hitMine } = revealCell(
        freshBoard,
        config.rows,
        config.cols,
        r,
        c,
      );
      setStarted(true);
      if (hitMine) {
        finishLoss(revealedBoard, r, c);
      } else {
        setBoard(revealedBoard);
        checkWin(revealedBoard);
      }
      return;
    }

    const { board: nextBoard, hitMine } = revealCell(
      board,
      config.rows,
      config.cols,
      r,
      c,
    );
    if (hitMine) {
      finishLoss(nextBoard, r, c);
    } else {
      setBoard(nextBoard);
      checkWin(nextBoard);
    }
  }

  function handleCellRightClick(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (status !== "playing") return;
    const cell = board[r][c];
    if (cell.revealed) return;
    const next = board.map((row) => row.map((c2) => ({ ...c2 })));
    next[r][c].flagged = !next[r][c].flagged;
    setBoard(next);
  }

  function handleCellDoubleClick(r: number, c: number) {
    if (status !== "playing" || !started) return;
    const cell = board[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;

    const { board: nextBoard, hitMine } = chordReveal(
      board,
      config.rows,
      config.cols,
      r,
      c,
    );
    if (hitMine) {
      let exploded: { r: number; c: number } | null = null;
      for (let rr = 0; rr < config.rows; rr++) {
        for (let cc = 0; cc < config.cols; cc++) {
          if (nextBoard[rr][cc].mine && nextBoard[rr][cc].revealed) {
            exploded = { r: rr, c: cc };
          }
        }
      }
      finishLoss(nextBoard, exploded?.r ?? r, exploded?.c ?? c);
    } else {
      setBoard(nextBoard);
      checkWin(nextBoard);
    }
  }

  const flaggedCount = board.reduce(
    (sum, row) => sum + row.filter((cell) => cell.flagged).length,
    0,
  );
  const minesLeft = config.mines - flaggedCount;

  function renderCell(cell: Cell, r: number, c: number) {
    const isExploded = explodedCell?.r === r && explodedCell?.c === c;
    let content: React.ReactNode = null;
    let bg = "bg-zinc-500 hover:bg-zinc-400";

    if (cell.revealed) {
      bg = isExploded ? "bg-red-600" : "bg-zinc-800";
      if (cell.mine) {
        content = "💣";
      } else if (cell.adjacent > 0) {
        content = (
          <span style={{ color: NUMBER_COLORS[cell.adjacent] }}>
            {cell.adjacent}
          </span>
        );
      }
    } else if (cell.flagged) {
      if (status === "lost" && !cell.mine) {
        content = "❌";
        bg = "bg-red-900/60";
      } else {
        content = "🚩";
      }
    }

    return (
      <button
        key={cellKey(r, c)}
        onClick={() => handleCellClick(r, c)}
        onContextMenu={(e) => handleCellRightClick(e, r, c)}
        onDoubleClick={() => handleCellDoubleClick(r, c)}
        className={`flex h-7 w-7 items-center justify-center rounded-[3px] border border-black/30 text-xs font-bold transition-colors ${bg}`}
      >
        {content}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#161b22] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm text-sky-300/70 transition-colors hover:text-white"
        >
          ← 返回首頁
        </Link>

        <div className="mt-4 flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-wide">💣 踩地雷</h1>
          <p className="mt-1 max-w-md text-sm text-sky-100/70">
            目標：在不踩到任何地雷的情況下，翻開雷區中所有安全的方格。數字代表周圍 8 格內的地雷數。
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => (
              <button
                key={key}
                onClick={() => resetGame(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  difficulty === key
                    ? "bg-sky-400 text-sky-950"
                    : "bg-white/10 text-sky-100/80 hover:bg-white/20"
                }`}
              >
                {DIFFICULTY_CONFIG[key].label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="rounded-full bg-black/25 px-4 py-1.5 font-mono font-semibold">
              🚩 {minesLeft}
            </span>
            <button
              onClick={() => resetGame()}
              className="rounded-full bg-white/10 px-5 py-1.5 text-lg transition-colors hover:bg-white/20"
              title="重新開始"
            >
              {status === "won" ? "😎" : status === "lost" ? "💀" : "🙂"}
            </button>
            <span className="rounded-full bg-black/25 px-4 py-1.5 font-mono font-semibold">
              ⏱ {seconds}
            </span>
          </div>

          {status !== "playing" && (
            <p
              className={`mt-3 text-lg font-extrabold ${
                status === "won" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {status === "won" ? "恭喜過關！所有安全格都翻開了 🎉" : "踩到地雷了，遊戲結束"}
            </p>
          )}

          <p className="mt-2 text-xs text-sky-100/40">
            左鍵翻開・右鍵插旗・在數字格上雙擊可快速翻開周圍方格
          </p>
        </div>

        <div className="mt-6 overflow-x-auto pb-4">
          <div
            className="mx-auto grid w-fit gap-[2px] rounded-lg bg-black/40 p-2"
            style={{ gridTemplateColumns: `repeat(${config.cols}, 28px)` }}
          >
            {board.flatMap((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
          </div>
        </div>
      </div>
    </main>
  );
}
