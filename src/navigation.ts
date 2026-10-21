import type { Building, Position } from './types';
export const WORLD = { width: 1680, height: 1760 };
export const CELL = 20;
export function blocked(x: number, y: number, buildings: Building[]): boolean {
  return x < 20 || y < 20 || x > WORLD.width - 20 || y > WORLD.height - 20 || buildings.some(b => b.kind !== 'park' && b.id !== 'park' && x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 10 && y < b.y + b.h + 10);
}
/** Grid A*, with no diagonal corner cutting. Each destination is reachable on foot. */
export function findPath(start: Position, end: Position, buildings: Building[]): Position[] {
  const cols = WORLD.width / CELL, rows = WORLD.height / CELL;
  const cell = (p: Position) => ({ x: Math.max(1, Math.min(cols - 2, Math.floor(p.x / CELL))), y: Math.max(1, Math.min(rows - 2, Math.floor(p.y / CELL))) });
  const a = cell(start), z = cell(end), key = (x: number, y: number) => y * cols + x;
  const point = (x: number, y: number) => ({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 });
  const free = (x: number, y: number) => !blocked(point(x, y).x, point(x, y).y, buildings);
  if (!free(z.x, z.y)) return [];
  const begin = key(a.x, a.y), goal = key(z.x, z.y);
  const queue = new Set([begin]), came = new Map<number, number>(), costs = new Map([[begin, 0]]);
  const heuristic = (n: number) => Math.hypot(n % cols - z.x, Math.floor(n / cols) - z.y);
  for (let iteration = 0; queue.size && iteration < 9000; iteration++) {
    let current = begin, best = Infinity;
    for (const n of queue) { const score = costs.get(n)! + heuristic(n); if (score < best) { current = n; best = score; } }
    if (current === goal) {
      const path = [point(z.x, z.y)];
      while (current !== begin) { current = came.get(current)!; path.push(point(current % cols, Math.floor(current / cols))); }
      path.reverse();
      if (!blocked(end.x, end.y, buildings)) path.push(end);
      return path;
    }
    queue.delete(current);
    const x = current % cols, y = Math.floor(current / cols);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (!free(nx, ny) || (dx && dy && (!free(x + dx, y) || !free(x, y + dy)))) continue;
      const neighbor = key(nx, ny), cost = costs.get(current)! + Math.hypot(dx, dy);
      if (cost >= (costs.get(neighbor) ?? Infinity)) continue;
      came.set(neighbor, current); costs.set(neighbor, cost); queue.add(neighbor);
    }
  }
  return [];
}
