import Character from '../Character';
import Bowman from '../Bowman';

test('Trying to create a Character', () => {
  const received = () => new Character();
  const expected = 'My dear, you should not call a Character, just characters :)';
  expect(received).toThrow(expected);
});

test('Trying to create a Bowman', () => {
  const received = new Bowman(1);
  const expected = {
    level: 1,
    attack: 25,
    defence: 25,
    health: 50,
    type: 'bowman',
    distance: 2,
    distanceAttack: 2,
  };
  expect(received).toEqual(expected);
});
