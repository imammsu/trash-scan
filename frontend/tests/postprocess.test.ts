import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLetterbox, decodeOutput, iou, nmsPerClass } from "../src/lib/postprocess.ts";

test("letterbox 1280x720 -> 416: skala dijaga, padding vertikal", () => {
  const lb = computeLetterbox(1280, 720, 416);
  assert.equal(lb.newW, 416);
  assert.equal(lb.newH, 234);
  assert.equal(lb.padX, 0);
  assert.equal(lb.padY, 91);
  assert.ok(Math.abs(lb.scale - 0.325) < 1e-9);
});

test("iou", () => {
  assert.equal(iou([0, 0, 10, 10], [0, 0, 10, 10]), 1);
  assert.equal(iou([0, 0, 10, 10], [20, 20, 30, 30]), 0);
  assert.ok(Math.abs(iou([0, 0, 10, 10], [5, 0, 15, 10]) - 1 / 3) < 1e-9);
});

test("NMS per kelas: kelas berbeda tidak saling menekan", () => {
  const dets = [
    { classId: 0, score: 0.9, box: [0, 0, 10, 10] as [number, number, number, number] },
    { classId: 0, score: 0.8, box: [1, 1, 11, 11] as [number, number, number, number] },
    { classId: 1, score: 0.7, box: [0, 0, 10, 10] as [number, number, number, number] },
  ];
  const kept = nmsPerClass(dets, 0.45, 10);
  assert.equal(kept.length, 2);
  assert.deepEqual(kept.map((d) => d.classId).sort(), [0, 1]);
});

test("decode: kembalikan koordinat ke ruang sumber (letterbox dibalik)", () => {
  const N = 3549;
  const C = 5;
  const out = new Float32Array((4 + C) * N);
  const lb = computeLetterbox(1280, 720, 416); // scale 0.325, padY 91
  // Kotak di sumber: x 320..640, y 180..360 (320x180)
  const cx = (480 * lb.scale + lb.padX);
  const cy = (270 * lb.scale + lb.padY);
  const i = 123;
  out[i] = cx; out[N + i] = cy; out[2 * N + i] = 320 * lb.scale; out[3 * N + i] = 180 * lb.scale;
  out[(4 + 2) * N + i] = 0.8; // kelas 2 (kertas)
  const dets = decodeOutput(out, N, C, 0.25, lb, 1280, 720);
  assert.equal(dets.length, 1);
  assert.equal(dets[0].classId, 2);
  const [x1, y1, x2, y2] = dets[0].box;
  assert.ok(Math.abs(x1 - 320) < 1 && Math.abs(y1 - 180) < 1 && Math.abs(x2 - 640) < 1 && Math.abs(y2 - 360) < 1);
});
