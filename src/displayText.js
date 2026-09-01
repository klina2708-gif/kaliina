const NON_BREAKING_SPACE='\u00A0';
const SHORT_RUSSIAN_WORDS=new Set([
 'а','без','бы','в','во','для','до','же','за','и','из','к','ко','ли','на','над','не','ни','о','об','обо','от','по','под','при','про','с','со','у',
]);
const HORIZONTAL_SPACE=/^[ \t]+$/;
const DISPLAY_WORD=/^[«„"([{]*([А-ЯЁа-яё]+)$/u;

function shortRussianWord(token){
 const match=token.match(DISPLAY_WORD);
 return match&&SHORT_RUSSIAN_WORDS.has(match[1].toLocaleLowerCase('ru-RU'));
}

export function prepareDisplayText(value){
 if(typeof value!=='string'||!/[А-ЯЁа-яё]/u.test(value))return value;
 const parts=value.split(/([ \t]+)/);
 for(let index=0;index<parts.length-2;index+=1){
  if(!shortRussianWord(parts[index])||!HORIZONTAL_SPACE.test(parts[index+1]))continue;
  if(!parts[index+2])continue;
  parts[index+1]=NON_BREAKING_SPACE;
 }
 return parts.join('');
}
