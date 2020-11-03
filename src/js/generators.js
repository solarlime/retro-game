/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  while (true) {
    const i = Math.floor(Math.random() * allowedTypes.length);
    const level = Math.ceil(Math.random() * maxLevel);

    yield new allowedTypes[i](level);
  }
}

/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  // TODO: write logic here
  const newHero = characterGenerator(allowedTypes, maxLevel);
  const team = [];

  for (let i = 0; i < characterCount; i++) {
    team.push(newHero.next().value);
  }
  return team;
}
