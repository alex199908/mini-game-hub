export const DIRECTIONS = ["up", "down", "left", "right"];

function emptyBoard() {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function addRandomTile(board, random = Math.random) {
  const empty = [];
  board.forEach((row, rowIndex) => row.forEach((value, colIndex) => {
    if (value === 0) empty.push([rowIndex, colIndex]);
  }));
  if (!empty.length) return board;
  const [row, col] = empty[Math.floor(random() * empty.length)];
  board[row][col] = random() < 0.9 ? 2 : 4;
  return board;
}

function slideLine(line) {
  const values = line.filter(Boolean);
  const result = [];
  let gained = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const merged = values[index] * 2;
      result.push(merged);
      gained += merged;
      index += 1;
    } else {
      result.push(values[index]);
    }
  }
  while (result.length < 4) result.push(0);
  return { line: result, gained };
}

function sameBoard(left, right) {
  return left.every((row, rowIndex) => row.every((value, colIndex) => value === right[rowIndex][colIndex]));
}

export function canMove(board) {
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      if (board[row][col] === 0) return true;
      if (col < 3 && board[row][col] === board[row][col + 1]) return true;
      if (row < 3 && board[row][col] === board[row + 1][col]) return true;
    }
  }
  return false;
}

export function createGame(best = 0, random = Math.random) {
  const board = emptyBoard();
  addRandomTile(board, random);
  addRandomTile(board, random);
  return { board, score: 0, best, history: [], status: "playing" };
}

export function move(game, direction, random = Math.random) {
  if (!DIRECTIONS.includes(direction) || game.status === "lost") return game;
  const before = cloneBoard(game.board);
  const next = emptyBoard();
  let gained = 0;

  for (let index = 0; index < 4; index += 1) {
    const source = direction === "left" || direction === "right"
      ? game.board[index].slice()
      : game.board.map((row) => row[index]);
    if (direction === "right" || direction === "down") source.reverse();
    const result = slideLine(source);
    const line = direction === "right" || direction === "down" ? result.line.reverse() : result.line;
    gained += result.gained;
    if (direction === "left" || direction === "right") next[index] = line;
    else line.forEach((value, lineIndex) => { next[lineIndex][index] = value; });
  }

  if (sameBoard(before, next)) return game;
  const history = [...game.history, { board: before, score: game.score, status: game.status }].slice(-30);
  const score = game.score + gained;
  const updated = {
    ...game,
    board: addRandomTile(next, random),
    score,
    best: Math.max(game.best, score),
    history,
    status: next.some((row) => row.includes(2048)) ? "won" : "playing"
  };
  if (updated.status === "playing" && !canMove(updated.board)) updated.status = "lost";
  return updated;
}

export function undo(game) {
  const previous = game.history.at(-1);
  if (!previous) return game;
  return { ...game, board: previous.board, score: previous.score, status: previous.status, history: game.history.slice(0, -1) };
}
