export default function tooltip(character) {
  return `${String.fromCodePoint(0x1F396)}${character.level} 
        ${String.fromCodePoint(0x2694)}${character.attack} 
        ${String.fromCodePoint(0x1F6E1)}${character.defence} 
        ${String.fromCodePoint(0x2764)}${character.health}`;
}
