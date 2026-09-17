export type Transform = { x: number; y: number; scale: number; roll: number; yaw: number };
export type SceneItem = Transform & { id: string; assetId: string };
export const MAX_OBJECTS = 10;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function coverCrop(sw: number, sh: number, dw: number, dh: number) {
  if ([sw, sh, dw, dh].some(n => !Number.isFinite(n) || n <= 0)) throw new Error('Dimensions invalides');
  const scale = Math.max(dw / sw, dh / sh);
  const width = dw / scale, height = dh / scale;
  return { x: (sw - width) / 2, y: (sh - height) / 2, width, height };
}
export function outputSize(width: number, height: number, maxSide = 1920) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
export type Point = { x: number; y: number };
export function gesture(points: Point[]) {
  const a = points[0], b = points[1] ?? a;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(b.x-a.x,b.y-a.y), angle: Math.atan2(b.y-a.y,b.x-a.x) };
}
export function applyGesture(base: Transform, start: ReturnType<typeof gesture>, now: ReturnType<typeof gesture>, width: number, height: number): Transform {
  const angle = Math.atan2(Math.sin(now.angle-start.angle), Math.cos(now.angle-start.angle));
  return { ...base, x: clamp(base.x + 2*(now.x-start.x)/width, -.88, .88), y: clamp(base.y - 2*(now.y-start.y)/height, -.78, .78),
    scale: clamp(base.scale * (start.distance > 4 ? now.distance/start.distance : 1), .2, 3),
    roll: base.roll - (start.distance > 4 ? angle : 0) };
}
