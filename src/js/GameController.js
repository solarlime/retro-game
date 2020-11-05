/* eslint-disable no-param-reassign, max-len,no-inner-declarations */
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
    this.level = 1;
    this.score = 0;
  }

  init() {
    this.theme = themes.prairie;
    this.gamePlay.drawUi(this.theme);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addNewGameListener(this.newGame.bind(this, this.level, this.theme));
    this.gamePlay.addEscListener(this.onEsc.bind(this));
    this.gamePlay.addLoadGameListener(this.loadGame.bind(this));
    this.gamePlay.addSaveGameListener(this.saveGame.bind(this));
  }

  newGame(level = 1, theme = themes.prairie) {
    this.level = level;
    this.gamePlay.drawUi(theme);
    this.gamePlay.deselectAll();
    this.selected = undefined;
    const light = this.sidePositions(this.sides.light);
    const dark = this.sidePositions(this.sides.dark);

    // Вспомогательная функция для выбора клетки
    function choosePoint(side) {
      const index = Math.floor(Math.random() * side.length);
      const point = side[index];
      side.splice(index, 1);
      return point;
    }

    if (level === 1) {
      this.positionsToDraw = [];
    }

    // Если игра начинается с начала
    if (!this.positionsToDraw.length) {
      const darkTeam = generateTeam(this.sides.dark.characters, level, 2);
      const lightTeam = generateTeam(this.sides.light.characters, level, 2);
      this.positionsToDraw = [
        lightTeam.map((item) => new PositionedCharacter(
          item, this.sides.light.name, choosePoint(light),
        )),
        darkTeam.map((item) => new PositionedCharacter(
          item, this.sides.dark.name, choosePoint(dark),
        )),
      ].flat();
    //  Иначе:
    } else {
      // Возвращаем оставшихся на исходные позиции
      this.positionsToDraw.forEach((hero) => { hero.position = choosePoint(light); });
      // Убираем уже занятые клетки из массива возможных для позиционирования
      const lightFiltered = this.sidePositions(this.sides.light).filter(
        (cell) => !this.positionsToDraw.find((hero) => hero.position === cell),
      );
      const darkTeam = generateTeam(this.sides.dark.characters, level, level * 2, true);
      const lightTeam = generateTeam(this.sides.light.characters, level, 2);
      this.positionsToDraw.push(lightTeam.map(
        (item) => new PositionedCharacter(item, this.sides.light.name, choosePoint(lightFiltered)),
      ));
      this.positionsToDraw.push(darkTeam.map(
        (item) => new PositionedCharacter(item, this.sides.dark.name, choosePoint(dark)),
      ));
      this.positionsToDraw = this.positionsToDraw.flat();
      GamePlay.showMessage('The enemies are furious! Be careful!');
    }
    this.gamePlay.redrawPositions(this.positionsToDraw);
  }

  loadGame() {
    this.gamePlay.deselectAll();
    this.selected = undefined;
    const loaded = this.stateService.load();
    if (!loaded) {
      GamePlay.showError('No game to load!');
    } else {
      this.level = loaded.level;
      this.positionsToDraw = loaded.positions;
      this.theme = loaded.theme;
      this.score = loaded.level;
      this.gamePlay.drawUi(loaded.theme);
      this.gamePlay.redrawPositions(this.positionsToDraw);
      GamePlay.showMessage('Loaded!');
    }
  }

  saveGame() {
    if (!this.positionsToDraw.length && !this.score) {
      GamePlay.showError('No game to save!');
    } else {
      const state = {
        level: this.level,
        positions: this.positionsToDraw,
        theme: this.theme,
        score: this.score,
      };
      this.stateService.save(state);
      GamePlay.showMessage('Saved!');
    }
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

  levelUp() {
    this.level += 1;
    this.positionsToDraw.forEach((hero) => {
      hero.character.level = this.level;
      hero.character.attack = Math.ceil(Math.max(hero.character.attack, hero.character.attack * (1.8 - hero.character.health / 100)));
      hero.character.health = (hero.character.health + 80 > 100) ? 100 : Math.ceil(hero.character.health + 80);
    });
    switch (this.level) {
      case 2:
        this.gamePlay.drawUi(themes.desert);
        this.theme = themes.desert;
        break;
      case 3:
        this.gamePlay.drawUi(themes.arctic);
        this.theme = themes.arctic;
        break;
      case 4:
        this.gamePlay.drawUi(themes.mountain);
        this.theme = themes.mountain;
        break;
      default:
        this.gamePlay.drawUi(themes.prairie);
        this.theme = themes.prairie;
        break;
    }
    return this.level;
  }

  moveRevenger(revenger, attacker, darks) {
    const movements = this.resolveArea(revenger, revenger.character.distance)
      .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
    const coordinates = (hero) => ({
      x: hero.position % this.gamePlay.boardSize,
      y: Math.floor(hero.position / this.gamePlay.boardSize),
    });
    const fighters = {
      revenger: coordinates(revenger),
      attacker: coordinates(attacker),
    };

    const probablePlaces = () => {
      // Вариант 1: движемся влево
      if (fighters.attacker.x <= fighters.revenger.x) {
        // Вариант 1.1: движемся влево и вверх
        if (fighters.attacker.y <= fighters.revenger.y) {
          return movements.filter(
            // Ограничиваем слева
            (item) => ((item % this.gamePlay.boardSize) >= fighters.attacker.x)
              // Ограничиваем справа
              && ((item % this.gamePlay.boardSize) <= fighters.revenger.x)
              // Ограничиваем снизу
              && (Math.floor(item / this.gamePlay.boardSize) <= fighters.revenger.y)
              // Ограничиваем сверху
              && (Math.floor(item / this.gamePlay.boardSize) >= fighters.attacker.y),
          );
        }
        //  Вариант 1.2: движемся влево и вниз
        return movements.filter(
          // Ограничиваем слева
          (item) => ((item % this.gamePlay.boardSize) >= fighters.attacker.x)
            // Ограничиваем справа
            && ((item % this.gamePlay.boardSize) <= fighters.revenger.x)
            // Ограничиваем сверху
            && (Math.floor(item / this.gamePlay.boardSize) > fighters.revenger.y)
            // Ограничиваем снизу
            && (Math.floor(item / this.gamePlay.boardSize) <= fighters.attacker.y),
        );
      }
      //  Вариант 2: движемся вправо
      // Вариант 2.1: движемся вправо и вверх
      if (fighters.attacker.y <= fighters.revenger.y) {
        return movements.filter(
          // Ограничиваем справа
          (item) => ((item % this.gamePlay.boardSize) <= fighters.attacker.x)
            // Ограничиваем слева
            && ((item % this.gamePlay.boardSize) > fighters.revenger.x)
            // Ограничиваем снизу
            && (Math.floor(item / this.gamePlay.boardSize) <= fighters.revenger.y)
            // Ограничиваем сверху
            && (Math.floor(item / this.gamePlay.boardSize) >= fighters.attacker.y),
        );
      }
      //  Вариант 2.2: движемся вправо и вниз
      return movements.filter(
        // Ограничиваем справа
        (item) => ((item % this.gamePlay.boardSize) <= fighters.attacker.x)
          // Ограничиваем слева
          && ((item % this.gamePlay.boardSize) > fighters.revenger.x)
          // Ограничиваем сверху
          && (Math.floor(item / this.gamePlay.boardSize) > fighters.revenger.y)
          // Ограничиваем снизу
          && (Math.floor(item / this.gamePlay.boardSize) <= fighters.attacker.y),
      );
    };

    const probables = probablePlaces();
    if (!probables.length) {
      if (!movements.length) {
        const otherDarks = [...darks];
        otherDarks.splice(darks.indexOf(revenger), 1);
        revenger = otherDarks[Math.floor(Math.random() * otherDarks.length)];
      }
      const randomMovements = this.resolveArea(revenger, revenger.character.distance)
        .filter((item) => this.positionsToDraw.findIndex((hero) => hero.position === item) === -1);
      return randomMovements[Math.floor(Math.random() * randomMovements.length)];
    }
    return probables[Math.floor(Math.random() * probablePlaces.length)];
  }

  moveDarksAndAttack() {
    this.gamePlay.deselectAll();
    const darks = this.positionsToDraw.filter((hero) => hero.side === this.sides.dark.name);
    // Атаковать будет самый сильный персонаж
    const revenger = darks.find(
      (item) => item.character.attack === Math.max.apply(
        null, darks.map((hero) => hero.character.attack),
      ),
    );
    return new Promise((resolve, reject) => {
      const damageToAttacker = Math.max(revenger.character.attack
        - this.selected.character.defence, revenger.character.attack * 0.1);
      // Если цель в пределах атаки - к бою!
      if (this.resolveArea(revenger, revenger.character.distanceAttack)
        .find((item) => item === this.selected.position)) {
        this.selected.character.health -= damageToAttacker;
        resolve(damageToAttacker);
        //  Иначе - движемся к нему
      } else {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({ revenger, darks });
      }
    });
  }

  onCellClick(index) {
    function wrapperForActionsAfterEnemyLogic() {
      if (this.selected?.character.health <= 0) {
        this.positionsToDraw.splice(this.positionsToDraw.indexOf(this.selected), 1);
      }
      this.gamePlay.redrawPositions(this.positionsToDraw);
      this.selected = undefined;
      // Проигрыш :(
      if (!this.positionsToDraw.find((item) => item.side === this.sides.light.name)) {
        this.gamePlay.drawUi(themes.prairie);
        GamePlay.showMessage('Game over!');
      }
    }

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
      this.moveDarksAndAttack()
        .then(
          (damageToAttacker) => this.gamePlay.showDamage(this.selected.position, damageToAttacker),
          (reject) => {
            reject.revenger.position = this.moveRevenger(reject.revenger, this.selected, reject.darks);
          },
        )
        .then(wrapperForActionsAfterEnemyLogic.bind(this));
      // Щёлкнули по союзнику
    } else if ((this.currentStatus === this.statuses.allied) && (this.selected !== point)) {
      this.gamePlay.deselectCell(this.selected.position);
      this.selected = point;
      this.gamePlay.selectCell(index);
      // Щёлкнули по врагу
    } else if (this.currentStatus === this.statuses.enemy) {
      const victim = this.positionsToDraw.find((hero) => hero.position === index);
      const damageToVictim = Math.max(this.selected.character.attack
        - victim.character.defence, this.selected.character.attack * 0.1);
      victim.character.health -= damageToVictim;
      // Если убили - удаляем с поля
      if (victim.character.health <= 0) {
        this.positionsToDraw.splice(this.positionsToDraw.indexOf(victim), 1);
        this.gamePlay.redrawPositions(this.positionsToDraw);
        this.gamePlay.deselectAll();
        // Убил противника: либо победа, либо он отвечает
        if (!this.positionsToDraw.find((item) => item.side === this.sides.dark.name)) {
          this.selected = undefined;
          this.score = this.positionsToDraw.reduce((accumulator, hero) => accumulator + hero.character.health, this.score);
          if (this.level === 4) {
            this.gamePlay.drawUi(themes.prairie);
            GamePlay.showMessage(`Victory! Your score is ${this.score}.`);
          } else {
            GamePlay.showMessage(`Level up! Your score is ${this.score}.`);
            this.newGame(this.levelUp(), this.theme);
          }
        } else {
          this.moveDarksAndAttack()
            .then(
              (damageToAttacker) => this.gamePlay
                .showDamage(this.selected.position, damageToAttacker),
              (reject) => {
                reject.revenger.position = this.moveRevenger(reject.revenger, this.selected, reject.darks);
              },
            )
            .then(wrapperForActionsAfterEnemyLogic.bind(this));
        }
      } else {
        this.gamePlay.showDamage(index, damageToVictim)
          .then(() => this.gamePlay.redrawPositions(this.positionsToDraw))
          // Ответ компьютера
          .then(() => this.moveDarksAndAttack())
          .then(
            (damageToAttacker) => this.gamePlay
              .showDamage(this.selected.position, damageToAttacker),
            (reject) => {
              reject.revenger.position = this.moveRevenger(reject.revenger, this.selected, reject.darks);
            },
          )
          .then(wrapperForActionsAfterEnemyLogic.bind(this));
      }
      //  В ином случае - ошибка
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
      if ((i >= 0) && (i < this.gamePlay.boardSize ** 2)) {
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
