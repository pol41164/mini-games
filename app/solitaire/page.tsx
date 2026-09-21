"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Suit = "S" | "H" | "D" | "C";
type CardType = { id: string; suit: Suit; rank: number };
type Location =
  | { type: "tableau"; index: number }
  | { type: "free"; index: number }
  | { type: "foundation"; suit: Suit };
type Selected = { location: Location; cards: CardType[] };
type GameState = {
  free: CardType[][];
  foundations: Record<Suit, CardType[]>;
  tableau: CardType[][];
};

const SUITS: Suit[] = ["S", "H", "D", "C"];
const RED_SUITS: Suit[] = ["H", "D"];
const SUIT_SYMBOL: Record<Suit, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const RANK_LABEL: Record<number, string> = { 1: "A", 11: "J", 12: "Q", 13: "K" };
const COLUMN_SIZES = [7, 7, 7, 7, 6, 6, 6, 6];
const FREE_CELL_COUNT = 4;

function rankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

function isRed(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}

function createDeck(): CardType[] {
  const deck: CardType[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `c${id++}`, suit, rank });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deal(): GameState {
  const deck = shuffle(createDeck());
  const tableau: CardType[][] = COLUMN_SIZES.map(() => []);
  let idx = 0;
  for (let col = 0; col < COLUMN_SIZES.length; col++) {
    for (let row = 0; row < COLUMN_SIZES[col]; row++) {
      tableau[col].push(deck[idx++]);
    }
  }
  return {
    free: Array.from({ length: FREE_CELL_COUNT }, (): CardType[] => []),
    foundations: { S: [], H: [], D: [], C: [] },
    tableau,
  };
}

function getPile(g: GameState, loc: Location): CardType[] {
  if (loc.type === "tableau") return g.tableau[loc.index];
  if (loc.type === "free") return g.free[loc.index];
  return g.foundations[loc.suit];
}

function sameLocation(a: Location, b: Location): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "tableau" && b.type === "tableau") return a.index === b.index;
  if (a.type === "free" && b.type === "free") return a.index === b.index;
  if (a.type === "foundation" && b.type === "foundation") return a.suit === b.suit;
  return false;
}

function isStackable(lower: CardType, upper: CardType): boolean {
  // `upper` sits directly on top of `lower` in the cascade, i.e. upper is
  // one rank lower than `lower` and the colors alternate.
  return isRed(lower.suit) !== isRed(upper.suit) && lower.rank === upper.rank + 1;
}

function canPlaceOnTableau(moving: CardType, destPile: CardType[]): boolean {
  if (destPile.length === 0) return true;
  return isStackable(destPile[destPile.length - 1], moving);
}

function canPlaceOnFoundation(
  moving: CardType,
  destPile: CardType[],
  suit: Suit,
): boolean {
  if (moving.suit !== suit) return false;
  if (destPile.length === 0) return moving.rank === 1;
  return destPile[destPile.length - 1].rank === moving.rank - 1;
}

function applyMove(
  game: GameState,
  source: Location,
  cardCount: number,
  dest: Location,
): GameState {
  const next: GameState = {
    free: game.free.map((slot) => [...slot]),
    foundations: {
      S: [...game.foundations.S],
      H: [...game.foundations.H],
      D: [...game.foundations.D],
      C: [...game.foundations.C],
    },
    tableau: game.tableau.map((col) => [...col]),
  };

  const sourcePile =
    source.type === "tableau"
      ? next.tableau[source.index]
      : source.type === "free"
        ? next.free[source.index]
        : next.foundations[source.suit];
  const moving = sourcePile.splice(sourcePile.length - cardCount, cardCount);

  const destPile =
    dest.type === "tableau"
      ? next.tableau[dest.index]
      : dest.type === "free"
        ? next.free[dest.index]
        : next.foundations[dest.suit];
  destPile.push(...moving);

  return next;
}

function CardView({
  card,
  selected,
  dragging,
  style,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
}: {
  card: CardType;
  selected?: boolean;
  dragging?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) {
  const red = isRed(card.suit);
  return (
    <div
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`absolute flex h-[calc(var(--cw)*10/7)] w-[var(--cw)] cursor-grab select-none flex-col justify-between rounded-lg border border-zinc-300 bg-white p-1 shadow-md transition-transform hover:-translate-y-1 active:cursor-grabbing sm:p-1.5 ${
        selected ? "-translate-y-2 ring-2 ring-amber-400" : ""
      } ${dragging ? "opacity-40" : ""} ${red ? "text-red-600" : "text-zinc-900"}`}
    >
      <div className="text-[9px] font-bold leading-none sm:text-[10px] md:text-xs">
        <div>{rankLabel(card.rank)}</div>
        <div>{SUIT_SYMBOL[card.suit]}</div>
      </div>
      <div className="self-center text-base leading-none sm:text-xl md:text-2xl">
        {SUIT_SYMBOL[card.suit]}
      </div>
      <div className="self-end rotate-180 text-[9px] font-bold leading-none sm:text-[10px] md:text-xs">
        <div>{rankLabel(card.rank)}</div>
        <div>{SUIT_SYMBOL[card.suit]}</div>
      </div>
    </div>
  );
}

export default function SolitairePage() {
  const [gameState, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [dragSource, setDragSource] = useState<Selected | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  // Deal client-side only: shuffling with Math.random() during the initial
  // render would make the server-rendered card order diverge from the
  // client's and trigger a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame(deal());
  }, []);

  function newGame() {
    setGame(deal());
    setSelected(null);
    setWon(false);
    setMoves(0);
  }

  if (!gameState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#04331f] text-white">
        <p className="text-sm text-emerald-100/60">正在發牌...</p>
      </main>
    );
  }

  const game = gameState;

  function tryMove(
    source: Location,
    movingCards: CardType[],
    dest: Location,
  ): boolean {
    if (sameLocation(source, dest)) return false;
    const first = movingCards[0];

    let valid = false;
    if (dest.type === "tableau") {
      const destPile = game.tableau[dest.index];
      valid =
        destPile.length === 0
          ? true
          : movingCards.length === 1 && canPlaceOnTableau(first, destPile);
    } else if (dest.type === "free") {
      valid = movingCards.length === 1 && game.free[dest.index].length === 0;
    } else if (dest.type === "foundation") {
      valid =
        movingCards.length === 1 &&
        canPlaceOnFoundation(first, game.foundations[dest.suit], dest.suit);
    }
    if (!valid) return false;

    const next = applyMove(game, source, movingCards.length, dest);
    setGame(next);
    setMoves((m) => m + 1);
    const total = SUITS.reduce((sum, s) => sum + next.foundations[s].length, 0);
    if (total === 52) setWon(true);
    return true;
  }

  function canSelect(loc: Location, idx: number): boolean {
    const pile = getPile(game, loc);
    const card = pile[idx];
    if (!card) return false;
    if ((loc.type === "free" || loc.type === "foundation") && idx !== pile.length - 1)
      return false;
    if (loc.type === "tableau") {
      // A card buried under others is only pickable together with the
      // cards on top of it, and only if that whole stack is already a
      // legal alternating/descending run.
      for (let i = idx; i < pile.length - 1; i++) {
        if (!isStackable(pile[i], pile[i + 1])) return false;
      }
    }
    return true;
  }

  function isSameSelectedCard(loc: Location, idx: number): boolean {
    if (!selected) return false;
    if (!sameLocation(selected.location, loc)) return false;
    const pile = getPile(game, loc);
    return pile.length - idx === selected.cards.length;
  }

  function handleCardClick(loc: Location, idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (won) return;
    const pile = getPile(game, loc);
    if (!pile[idx]) return;

    if (selected) {
      if (isSameSelectedCard(loc, idx)) {
        setSelected(null);
        return;
      }
      const moved = tryMove(selected.location, selected.cards, loc);
      if (moved) {
        setSelected(null);
        return;
      }
      if (canSelect(loc, idx)) {
        setSelected({ location: loc, cards: pile.slice(idx) });
      } else {
        setSelected(null);
      }
      return;
    }

    if (canSelect(loc, idx)) {
      setSelected({ location: loc, cards: pile.slice(idx) });
    }
  }

  function handleCardDoubleClick(loc: Location, idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (won) return;
    const pile = getPile(game, loc);
    if (idx !== pile.length - 1) return;
    const card = pile[idx];
    const moved = tryMove(loc, [card], { type: "foundation", suit: card.suit });
    if (moved) setSelected(null);
  }

  function handlePileClick(loc: Location) {
    if (won || !selected) return;
    const moved = tryMove(selected.location, selected.cards, loc);
    if (moved) setSelected(null);
  }

  function handleDragStart(loc: Location, idx: number, e: React.DragEvent) {
    if (won || !canSelect(loc, idx)) {
      e.preventDefault();
      return;
    }
    const pile = getPile(game, loc);
    const cards = pile.slice(idx);
    setSelected({ location: loc, cards });
    setDragSource({ location: loc, cards });
    e.dataTransfer.effectAllowed = "move";
    // Firefox refuses to start a drag unless data is actually set.
    e.dataTransfer.setData("text/plain", cards.map((c) => c.id).join(","));
  }

  function handleDragEnd() {
    setDragSource(null);
    setSelected(null);
  }

  function handleDragOver(e: React.DragEvent) {
    if (!dragSource) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(loc: Location, e: React.DragEvent) {
    e.preventDefault();
    if (won || !dragSource) return;
    tryMove(dragSource.location, dragSource.cards, loc);
    setSelected(null);
    setDragSource(null);
  }

  return (
    <main className="min-h-screen bg-[#04331f] px-4 py-10 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm text-emerald-200/70 transition-colors hover:text-white"
        >
          ← 返回首頁
        </Link>

        <div className="mt-4 flex flex-col items-center text-center">
          <h1 className="text-3xl font-extrabold tracking-wide sm:text-4xl">🃏 接龍</h1>
          <p className="mt-1 max-w-lg text-sm text-emerald-100/70">
            目標：把 52 張牌依花色從 A 收集到 K，堆進右上角的目標格。牌列排列需紅黑交替、由大到小遞減；左上角的自由儲存格可暫放單張牌，方便取出壓在下方的關鍵牌。
          </p>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="rounded-full bg-black/20 px-4 py-1.5 font-semibold">
              步數：{moves}
            </span>
            <button
              onClick={newGame}
              className="rounded-full bg-emerald-400 px-5 py-1.5 font-bold text-emerald-950 transition-colors hover:bg-emerald-300"
            >
              重新開始
            </button>
          </div>
          <p className="mt-2 text-xs text-emerald-100/40">
            直接拖曳紙牌到目的地即可移動，或點一張牌選取、再點目的地；空欄可放任意單張牌或合法連續牌組；點兩下可直接送上目標格
          </p>
        </div>

        <div className="mt-8 overflow-x-auto pb-4">
          <div className="mx-auto w-fit [--cw:44px] sm:[--cw:56px] md:[--cw:70px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-emerald-100/50">
                  自由儲存區
                </p>
                <div className="flex gap-2 sm:gap-3">
                  {game.free.map((slot, i) => {
                    const isSelected =
                      !!selected &&
                      selected.location.type === "free" &&
                      selected.location.index === i;
                    return (
                      <div
                        key={i}
                        onClick={() => handlePileClick({ type: "free", index: i })}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop({ type: "free", index: i }, e)}
                        className="relative h-[calc(var(--cw)*10/7)] w-[var(--cw)]"
                      >
                        {slot.length === 0 ? (
                          <div className="h-[calc(var(--cw)*10/7)] w-[var(--cw)] rounded-lg border-2 border-dashed border-white/15" />
                        ) : (
                          <CardView
                            card={slot[0]}
                            selected={isSelected}
                            dragging={isSelected && !!dragSource}
                            onClick={(e) =>
                              handleCardClick({ type: "free", index: i }, 0, e)
                            }
                            onDoubleClick={(e) =>
                              handleCardDoubleClick({ type: "free", index: i }, 0, e)
                            }
                            onDragStart={(e) =>
                              handleDragStart({ type: "free", index: i }, 0, e)
                            }
                            onDragEnd={handleDragEnd}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-emerald-100/50">
                  目標格
                </p>
                <div className="flex gap-2 sm:gap-3">
                  {SUITS.map((suit) => {
                    const isSelected =
                      !!selected &&
                      selected.location.type === "foundation" &&
                      selected.location.suit === suit;
                    return (
                      <div
                        key={suit}
                        onClick={() => handlePileClick({ type: "foundation", suit })}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop({ type: "foundation", suit }, e)}
                        className="relative h-[calc(var(--cw)*10/7)] w-[var(--cw)]"
                      >
                        {game.foundations[suit].length === 0 ? (
                          <div
                            className={`flex h-[calc(var(--cw)*10/7)] w-[var(--cw)] items-center justify-center rounded-lg border-2 border-dashed text-base sm:text-xl md:text-2xl ${
                              isRed(suit)
                                ? "border-red-400/25 text-red-400/25"
                                : "border-white/20 text-white/20"
                            }`}
                          >
                            {SUIT_SYMBOL[suit]}
                          </div>
                        ) : (
                          <CardView
                            card={game.foundations[suit][game.foundations[suit].length - 1]}
                            selected={isSelected}
                            dragging={isSelected && !!dragSource}
                            onClick={(e) =>
                              handleCardClick(
                                { type: "foundation", suit },
                                game.foundations[suit].length - 1,
                                e,
                              )
                            }
                            onDragStart={(e) =>
                              handleDragStart(
                                { type: "foundation", suit },
                                game.foundations[suit].length - 1,
                                e,
                              )
                            }
                            onDragEnd={handleDragEnd}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-1.5 sm:mt-8 sm:gap-2 md:gap-3">
              {game.tableau.map((column, colIndex) => {
                // ratios are expressed in units of one card width (--cw); at
                // the original 70px card width these match the old raw px
                // values (26px stack offset, 100px card height).
                const positionRatios = column.map((_, idx) => (idx * 26) / 70);
                const colHeightRatio = Math.max(
                  2,
                  positionRatios.length > 0
                    ? positionRatios[positionRatios.length - 1] + 10 / 7
                    : 2,
                );

                return (
                  <div
                    key={colIndex}
                    onClick={() => handlePileClick({ type: "tableau", index: colIndex })}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop({ type: "tableau", index: colIndex }, e)}
                    className="relative w-[var(--cw)]"
                    style={{ height: `calc(var(--cw) * ${colHeightRatio})` }}
                  >
                    {column.length === 0 && (
                      <div className="absolute h-[calc(var(--cw)*10/7)] w-[var(--cw)] rounded-lg border-2 border-dashed border-white/15" />
                    )}
                    {column.map((card, idx) => {
                      const isSelected =
                        !!selected &&
                        selected.location.type === "tableau" &&
                        selected.location.index === colIndex &&
                        idx >= column.length - selected.cards.length;
                      return (
                        <CardView
                          key={card.id}
                          card={card}
                          selected={isSelected}
                          dragging={isSelected && !!dragSource}
                          style={{
                            top: `calc(var(--cw) * ${positionRatios[idx]})`,
                            zIndex: idx,
                          }}
                          onClick={(e) =>
                            handleCardClick({ type: "tableau", index: colIndex }, idx, e)
                          }
                          onDoubleClick={(e) =>
                            handleCardDoubleClick(
                              { type: "tableau", index: colIndex },
                              idx,
                              e,
                            )
                          }
                          onDragStart={(e) =>
                            handleDragStart(
                              { type: "tableau", index: colIndex },
                              idx,
                              e,
                            )
                          }
                          onDragEnd={handleDragEnd}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="rounded-3xl bg-emerald-900 p-10 text-center shadow-2xl">
            <p className="text-4xl">🎉</p>
            <p className="mt-2 text-2xl font-extrabold text-amber-300">恭喜過關！</p>
            <p className="mt-1 text-sm text-emerald-100/70">共花費 {moves} 步完成</p>
            <button
              onClick={newGame}
              className="mt-6 rounded-full bg-amber-400 px-8 py-3 text-sm font-bold text-emerald-950 transition-colors hover:bg-amber-300"
            >
              再玩一次
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
