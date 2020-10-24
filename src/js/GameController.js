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
import GamePlay from './GamePlay';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.sides = {
      light: {
        name: 'light', first: 0, second: 1, characters: [Bowman, Swordsman, Magician],
      },
      dark: {
        name: 'dark', first: 6, second: 7, characters: [Vampire, Daemon, Undead],
      },
    };
    this.positionsToDraw = [];
    this.selected = undefined;
    this.movements = [];
    this.attacks = [];
    this.statuses = {
      freespace: 'free space',
      enemy: 'enemy',
      allied: 'allied',
      notallowed: 'notallowed',
    };
    this.currentStatus = undefined;
  }

  init() {
    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this));
    this.gamePlay.addEscListener(this.onEsc.bind(this));
    // this.gamePlay.addLoadGameListener(this.loadGame.bind(this));
    // this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
  }

  newGame() {
    const light = this.sidePositions(this.sides.light);
    const dark = this.sidePositions(this.sides.dark);
    const lightTeam = generateTeam(this.sides.light.characters, 1, 2);
    const darkTeam = generateTeam(this.sides.dark.characters, 1, 2);

    function choosePoint(side) {
      const index = Math.floor(Math.random() * side.length);
      const point = side[index];
      side.splice(index, 1);
      return point;
    }

    this.positionsToDraw = [
      lightTeam.map((item) => new PositionedCharacter(
        item, this.sides.light.name, choosePoint(light),
      )),
      darkTeam.map((item) => new PositionedCharacter(
        item, this.sides.dark.name, choosePoint(dark),
      )),
    ].flat();
    this.gamePlay.redrawPositions(this.positionsToDraw);
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

  onEsc() {
    if (this.selected) {
      this.gamePlay.deselectAll();
    }
    this.selected = undefined;
    this.movements = [];
    this.attacks = [];
    this.currentStatus = undefined;
  }

  onCellClick(index) {
    // Выделен ли кто-то
    const point = this.positionsToDraw.find((item) => item.position === index);
    if (this.selected === undefined) {
      // Не выделен
      if (!point) {
      //  Не делай ничего
      } else if (['bowman', 'swordsman', 'magician'].includes(point.character.type)) {
        this.selected = point;
        this.gamePlay.selectCell(index);
      } else {
        GamePlay.showError('This character is not playable!');
      }
    } else if (this.currentStatus === this.statuses.freespace) {
      // Чтобы двигать
      [this.selected.position, index].forEach((cell) => this.gamePlay.deselectCell(cell));
      this.selected.position = index;
      this.gamePlay.redrawPositions(this.positionsToDraw);
      this.selected = undefined;
    } else if (this.currentStatus === this.statuses.allied) {
      this.gamePlay.deselectCell(this.selected.position);
      this.selected = point;
      this.gamePlay.selectCell(index);
    } else if (this.currentStatus === this.statuses.enemy) {
      console.log('Атака!');
    } else {
      GamePlay.showError('This action is not allowed!');
      this.gamePlay.deselectCell(this.selected.position);
      this.selected = undefined;
    }
  }

  resolveArea(point, action) {
    const area = [];
    // Определяем пространство по вертикали
    for (
      let i = point.position - this.gamePlay.boardSize * action;
      (i <= point.position + this.gamePlay.boardSize * action);
      i += this.gamePlay.boardSize
    ) {
      // Определяем пространство по горизонтали
      for (
        let j = i - action;
        j <= i + action;
        j += 1
      ) {
        if (
          // Ограничиваем слева
          (j >= i - (i % this.gamePlay.boardSize))
          // Ограничиваем справа
          && (j < i + (this.gamePlay.boardSize - (i % this.gamePlay.boardSize)))
        ) {
          area.push(j);
        }
      }
    }
    // Удаляем клетку героя из списка возможных ходов
    area.splice(area.indexOf(point.position), 1);
    return area;
  }

  onCellEnter(index) {
    this.positionsToDraw.forEach((item) => {
      if (item.position === index) {
        this.gamePlay.showCellTooltip(tooltip(item.character), index);
      }
    });

    // Если кто-то выделен
    if (this.selected) {
      const actions = {
        distance: this.selected.character.distance,
        distanceAttack: this.selected.character.distanceAttack,
      };
      this.movements = this.resolveArea(this.selected, actions.distance)
        // Оставляем только клетки, не занятые героями
        .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
      this.attacks = this.resolveArea(this.selected, actions.distanceAttack)
        // Оставляем только клетки, не занятые героями
        .filter((item) => this.positionsToDraw.findIndex((hero) => (hero.position === item)
          && (hero.side === this.sides.light.name)) === -1);

      // Клетка доступна для хода
      if (this.movements.includes(index)) {
        this.gamePlay.selectCell(index, 'green');
        this.gamePlay.setCursor(cursors.pointer);
        this.currentStatus = this.statuses.freespace;
      //  Клетка доступна для атаки
      } else if (this.attacks.includes(index)
        && this.positionsToDraw.filter((item) => item.side === this.sides.dark.name)
          .find((item) => item.position === index)) {
        this.gamePlay.selectCell(index, 'red');
        this.gamePlay.setCursor(cursors.crosshair);
        this.currentStatus = this.statuses.enemy;
      //  Клетка занята союзником
      } else if (this.positionsToDraw.filter((item) => item.side === this.sides.light.name)
        .find((item) => (item.position === index) && (item.position !== this.selected.position))) {
        this.gamePlay.setCursor(cursors.pointer);
        this.currentStatus = this.statuses.allied;
      //  Иная ситуация
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
        this.currentStatus = this.statuses.notallowed;
      }
    //  Если никто не выделен
    } else if (this.positionsToDraw.filter((hero) => hero.side === this.sides.light.name)
      .find((item) => item.position === index)) {
      // Союзникам - pointer
      this.gamePlay.setCursor(cursors.pointer);
    } else {
      // Иначе - auto
      this.gamePlay.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    if (index !== this.selected?.position) {
      this.gamePlay.deselectCell(index);
    }
    this.gamePlay.setCursor(cursors.auto);
  }
}
