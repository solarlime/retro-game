import GameStateService from '../GameStateService';

beforeEach(() => {
  jest.resetAllMocks();
});

test('Trying to load', () => {
  const state = {
    level: 1,
    positions: [],
    theme: 'prairie',
    score: 0,
  };
  const gameState = new GameStateService(localStorage);
  gameState.save(state);
  const load = jest.fn(gameState.load());
  load.mockReturnValue(state);
  expect(gameState.load()).toEqual(load());
});
