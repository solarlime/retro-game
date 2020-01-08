import { calcTileType, calcHealthLevel } from '../utils';

test('calcTileType: top-left', () => {
  const expected = 'top-left';
  const received = calcTileType(0, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: top', () => {
  const expected = 'top';
  const received = calcTileType(5, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: top-right', () => {
  const expected = 'top-right';
  const received = calcTileType(7, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: left', () => {
  const expected = 'left';
  const received = calcTileType(16, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: center', () => {
  const expected = 'center';
  const received = calcTileType(18, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: right', () => {
  const expected = 'right';
  const received = calcTileType(23, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: bottom-left', () => {
  const expected = 'bottom-left';
  const received = calcTileType(56, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: bottom', () => {
  const expected = 'bottom';
  const received = calcTileType(60, 8);
  expect(received).toEqual(expected);
});

test('calcTileType: bottom-right', () => {
  const expected = 'bottom-right';
  const received = calcTileType(63, 8);
  expect(received).toEqual(expected);
});
