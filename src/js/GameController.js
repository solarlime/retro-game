import themes from './themes';
import PositionedCharacter from './PositionedCharacter';
import tooltip from './tooltip';
import { generateTeam } from './generators';
import Bowman from './Bowman';
import Swordsman from './Swordsman';
import Magician from './Magician';
import Vampire from './Vampire';
import Daemon from './Daemon';
import Undead from './Undead';

const lightSide = [];
const darkSide = [];

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.sides = {
      light: { first: 0, second: 1, characters: [Bowman, Swordsman, Magician] },
      dark: { first: 6, second: 7, characters: [Vampire, Daemon, Undead] },
    };
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
  }

  newGame() {
    const light = this.sidePositions(this.sides.light);
    const dark = this.sidePositions(this.sides.dark);
    const lightTeam = generateTeam(this.sides.light.characters, 1, 10);
    const darkTeam = generateTeam(this.sides.dark.characters, 1, 10);

    function choose(side) {
      const index = Math.floor(Math.random() * side.length);
      const point = side[index];
      side.splice(index, 1);
      return point;
    }

    const positionsToDraw = [
      lightTeam.map((item) => new PositionedCharacter(item, choose(light))),
      darkTeam.map((item) => new PositionedCharacter(item, choose(dark))),
    ].flat();
    this.gamePlay.redrawPositions(positionsToDraw);
  }

  positions() {
    const positions = [];
    for (let i = 0; i < this.gamePlay.boardSize ** 2; i += 1) {
      positions.push(i);
    }
    return { array: positions, lineLength: this.gamePlay.boardSize, length: positions.length };
  }

  sidePositions(side) {
    const field = this.positions();
    return field.array.filter((item) => (item % field.lineLength === side.first)
      || (item % field.lineLength === side.second)).map((item) => item);
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    [...lightSide, ...darkSide].forEach((item) => {
      if (item.position === index) this.gamePlay.showCellTooltip(tooltip(item.character), index);
    });
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    // this.gamePlay.hideCellTooltip(index);
  }
}
