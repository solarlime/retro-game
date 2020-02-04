import GamePlay from './GamePlay';
import themes from './themes';
import PositionedCharacter from "./PositionedCharacter";

let lightSide = [];
let darkSide = [];

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
  }

  onCellClick(index) {
    // TODO: react to click
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    [...lightSide, ...darkSide].forEach((item) => {
      item.position === index ? this.gamePlay.showCellTooltip(
        `${String.fromCodePoint(0x1F396)}${item.character.level} 
        ${String.fromCodePoint(0x2694)}${item.character.attack} 
        ${String.fromCodePoint(0x1F6E1)}${item.character.defence} 
        ${String.fromCodePoint(0x2764)}${item.character.health}`,
        index,
      ) : null;
    });

  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.hideCellTooltip(index);
  }
}
