export const SUITS = [
  { symbol: "♣", color: "black", value: 0 },
  { symbol: "♦", color: "red", value: 1 },
  { symbol: "♥", color: "red", value: 2 },
  { symbol: "♠", color: "black", value: 3 }
];
export const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
const FIVE_RANK = { straight: 0, flush: 1, fullHouse: 2, fourKind: 3, straightFlush: 4 };

export function makeDeck() {
  return SUITS.flatMap((suit, suitIndex) => RANKS.map((rank, rankIndex) => ({
    rank,
    suit: suit.symbol,
    color: suit.color,
    rankIndex,
    suitIndex,
    value: rankIndex * 4 + suitIndex
  })));
}
export function shuffle(deck) {
  const next = deck.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}
export function sortCards(cards) { return cards.slice().sort((left, right) => left.value - right.value); }
export function containsClub3(cards) { return cards.some((card) => card.rank === "3" && card.suit === "♣"); }
export function removeCards(hand, played) {
  const values = new Set(played.map((card) => card.value));
  return hand.filter((card) => !values.has(card.value));
}

function lexCompare(left, right) {
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta) return delta;
  }
  return 0;
}
function straightInfo(cards) {
  const ranks = [...new Set(cards.map((card) => card.rankIndex))].sort((a, b) => a - b);
  if (ranks.length !== 5) return null;
  const wheel = ranks.join(",") === "0,1,2,11,12"; // A2345，視為最小特殊順子
  const normal = ranks.at(-1) <= 11 && ranks.every((rank, index) => index === 0 || rank === ranks[index - 1] + 1);
  if (!wheel && !normal) return null;
  const highRank = wheel ? 2 : ranks.at(-1);
  const highSuit = Math.max(...cards.filter((card) => card.rankIndex === highRank).map((card) => card.suitIndex));
  return { highRank: wheel ? -1 : highRank, highSuit, wheel };
}
function groups(cards) {
  const map = new Map();
  cards.forEach((card) => map.set(card.rankIndex, [...(map.get(card.rankIndex) || []), card]));
  return [...map.entries()].map(([rank, group]) => ({ rank, cards: group })).sort((a, b) => b.cards.length - a.cards.length || b.rank - a.rank);
}

export function evaluateHand(cards) {
  const hand = sortCards(cards);
  if (hand.length === 1) return { valid: true, count: 1, type: "single", typeLabel: "單張", score: [hand[0].value] };
  if (hand.length === 2 && hand[0].rankIndex === hand[1].rankIndex) {
    return { valid: true, count: 2, type: "pair", typeLabel: "對子", score: [hand[0].rankIndex, Math.max(...hand.map((card) => card.suitIndex))] };
  }
  if (hand.length === 3 && hand.every((card) => card.rankIndex === hand[0].rankIndex)) {
    return { valid: true, count: 3, type: "triple", typeLabel: "三條", score: [hand[0].rankIndex] };
  }
  if (hand.length !== 5) return { valid: false, count: hand.length, type: "invalid", typeLabel: "無效牌型", score: [] };

  const grouped = groups(hand);
  const flush = hand.every((card) => card.suit === hand[0].suit);
  const straight = straightInfo(hand);
  let type; let score;
  if (straight && flush) { type = "straightFlush"; score = [FIVE_RANK[type], straight.highRank, straight.highSuit]; }
  else if (grouped[0].cards.length === 4) { type = "fourKind"; score = [FIVE_RANK[type], grouped[0].rank]; }
  else if (grouped[0].cards.length === 3 && grouped[1]?.cards.length === 2) { type = "fullHouse"; score = [FIVE_RANK[type], grouped[0].rank]; }
  else if (flush) { type = "flush"; score = [FIVE_RANK[type], ...hand.map((card) => card.value).sort((a, b) => b - a)]; }
  else if (straight) { type = "straight"; score = [FIVE_RANK[type], straight.highRank, straight.highSuit]; }
  else return { valid: false, count: 5, type: "invalid", typeLabel: "無效五張牌", score: [] };

  const labels = { straight: "順子", flush: "同花", fullHouse: "葫蘆", fourKind: "鐵支", straightFlush: "同花順" };
  return { valid: true, count: 5, type, typeLabel: labels[type], score };
}
export function compareHands(leftCards, rightCards) {
  const left = evaluateHand(leftCards); const right = evaluateHand(rightCards);
  if (!left.valid || !right.valid || left.count !== right.count) return null;
  return lexCompare(left.score, right.score);
}
export function canPlay(cards, lastCards = null, mustContainClub3 = false) {
  const hand = evaluateHand(cards);
  if (!hand.valid) return { ok: false, reason: hand.typeLabel, hand };
  if (mustContainClub3 && !containsClub3(cards)) return { ok: false, reason: "首手必須包含梅花 3", hand };
  if (!lastCards?.length) return { ok: true, reason: "", hand };
  const last = evaluateHand(lastCards);
  if (hand.count !== last.count) return { ok: false, reason: `必須出 ${last.count} 張`, hand };
  const comparison = compareHands(cards, lastCards);
  if (comparison === null || comparison <= 0) return { ok: false, reason: `必須大過 ${last.typeLabel}`, hand };
  return { ok: true, reason: "", hand };
}
function combinations(cards, count, start = 0, prefix = [], output = []) {
  if (prefix.length === count) { output.push(prefix.slice()); return output; }
  for (let index = start; index <= cards.length - (count - prefix.length); index += 1) {
    prefix.push(cards[index]); combinations(cards, count, index + 1, prefix, output); prefix.pop();
  }
  return output;
}
export function findCpuPlay(hand, lastCards = null, mustContainClub3 = false) {
  const counts = lastCards?.length ? [lastCards.length] : [5, 3, 2, 1];
  const options = [];
  counts.forEach((count) => combinations(hand, count).forEach((cards) => {
    const result = canPlay(cards, lastCards, mustContainClub3);
    if (result.ok) options.push({ cards, evaluation: result.hand });
  }));
  options.sort((left, right) => {
    if (!lastCards?.length && left.cards.length !== right.cards.length) return right.cards.length - left.cards.length;
    return lexCompare(left.evaluation.score, right.evaluation.score);
  });
  return options[0]?.cards || null;
}
export function handLabel(cards) {
  const evaluated = evaluateHand(cards);
  return evaluated.valid ? evaluated.typeLabel : evaluated.typeLabel;
}
