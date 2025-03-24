jest.mock('node-fetch', () => {
  return jest.fn(() => Promise.resolve({
    json: () => Promise.resolve([]),
  }));
});

const { clickInside, isColliding, spiralPathA, spiralPathB, spiralPathC, getPathPoint } = require('./frontend/starDefender');

test('clickInside returns true for inside point', () => {
  const rect = { x: 100, y: 100, width: 50, height: 50 };
  expect(clickInside(110, 110, rect)).toBe(true);
});

test('clickInside returns false for outside point', () => {
  const rect = { x: 100, y: 100, width: 50, height: 50 };
  expect(clickInside(90, 90, rect)).toBe(false);
});

test('isColliding returns true for overlapping rectangles', () => {
  const a = { x: 100, y: 100, width: 50, height: 50 };
  const b = { x: 120, y: 120, width: 50, height: 50 };
  expect(isColliding(a, b)).toBe(true);
});

test('isColliding returns false for non-overlapping rectangles', () => {
  const a = { x: 100, y: 100, width: 50, height: 50 };
  const b = { x: 200, y: 200, width: 50, height: 50 };
  expect(isColliding(a, b)).toBe(false);
});

test('spiralPathA returns correct values at t=0', () => {
  const result = spiralPathA(0, 100, 100);
  expect(result.x).toBeCloseTo(150);
  expect(result.y).toBeCloseTo(100);
});

test('spiralPathB returns correct values at t=0', () => {
  const result = spiralPathB(0, 100, 100);
  expect(result.x).toBeCloseTo(160);
  expect(result.y).toBeCloseTo(100);
});

test('spiralPathC returns correct values at t=0', () => {
  const result = spiralPathC(0, 100, 100);
  expect(result.x).toBeCloseTo(140);
  expect(result.y).toBeCloseTo(100);
});

test('getPathPoint returns spiralPathA when type is A', () => {
  const result = getPathPoint('A', 0, 100, 100);
  const expected = spiralPathA(0, 100, 100);
  expect(result.x).toBeCloseTo(expected.x);
  expect(result.y).toBeCloseTo(expected.y);
});

test('getPathPoint returns spiralPathB when type is B', () => {
  const result = getPathPoint('B', 0, 100, 100);
  const expected = spiralPathB(0, 100, 100);
  expect(result.x).toBeCloseTo(expected.x);
  expect(result.y).toBeCloseTo(expected.y);
});

test('getPathPoint returns spiralPathC when type is not A or B', () => {
  const result = getPathPoint('C', 0, 100, 100);
  const expected = spiralPathC(0, 100, 100);
  expect(result.x).toBeCloseTo(expected.x);
  expect(result.y).toBeCloseTo(expected.y);
});

