import tooltip from '../tooltip';

test('Creating a tooltip', () => {
  const character = {
    level: 1,
    attack: 25,
    defence: 25,
    health: 50,
    type: 'bowman',
    distance: 2,
    distanceAttack: 2,
  };
  const received = tooltip(character);
  const expected = '🎖1 ⚔25 🛡25 ❤50';
  expect(received).toEqual(expected);
});
