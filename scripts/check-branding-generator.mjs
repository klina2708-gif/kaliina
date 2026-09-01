import {createBrandingResult,isValidBrandPalette,rememberBrandingResult,summarizeBrandingResult,textSimilarity} from '../src/brandingGenerator.js';
import {randomizerData} from '../src/data/randomizerData.js';

const memory={value:'[]',getItem(){return this.value},setItem(_key,value){this.value=value}};
let history=[];
const results=[];
for(let index=0;index<100;index+=1){
 const result=createBrandingResult(history);
 results.push(result);
 history=rememberBrandingResult(result,history,memory);
}

const summaries=results.map(summarizeBrandingResult);
const failures=[];
for(let index=0;index<summaries.length;index+=1){
 const current=summaries[index];
 const before=summaries.slice(Math.max(0,index-20),index);
 if(before.slice(-7).some(item=>item.theme===current.theme))failures.push(`theme repeat at ${index}`);
 if(before.some(item=>item.name===current.name))failures.push(`name repeat at ${index}`);
 if(before.slice(-18).some(item=>item.mood===current.mood))failures.push(`mood repeat at ${index}`);
 if(before.slice(-4).some(item=>item.fontPair===current.fontPair))failures.push(`font repeat at ${index}`);
 if(before.slice(-12).some(item=>textSimilarity(item.name,current.name)>=.67))failures.push(`similar name at ${index}`);
 if(index>1&&summaries[index-1].group===current.group&&summaries[index-2].group===current.group)failures.push(`theme group series at ${index}`);
 const result=results[index];
 const sharesTags=item=>item.tags.some(tag=>result.theme.tags.includes(tag));
 if(!result.name.tags.includes(result.theme.group))failures.push(`name outside theme group at ${index}`);
 if(result.name.scopes&&!result.name.scopes.includes(result.theme.scope))failures.push(`name outside theme scope at ${index}`);
 if(!sharesTags(result.name)||!sharesTags(result.mood)||!sharesTags(result.fonts))failures.push(`unlinked result at ${index}`);
 if(![result.theme.name,result.name.name,result.mood.name,result.fonts.display,result.fonts.body].every(value=>typeof value==='string'&&value.trim()))failures.push(`empty text at ${index}`);
 if(!isValidBrandPalette(result.palette))failures.push(`invalid palette at ${index}`);
 if(result.palette.colors.length!==4||new Set(result.palette.colors.map(color=>color.toUpperCase())).size!==4)failures.push(`palette cardinality at ${index}`);
 if(result.palette.roles?.length!==4||new Set(result.palette.roles).size!==4)failures.push(`palette roles at ${index}`);
 if(!result.fonts.cyrillic||![result.fonts.displayWeight,result.fonts.bodyWeight].every(Number.isFinite))failures.push(`font fallback metadata at ${index}`);
}

if(randomizerData.palettes.some(palette=>!isValidBrandPalette(palette)))failures.push('invalid palette in source data');
if(new Set(randomizerData.palettes.map(palette=>palette.paletteTone)).size<15)failures.push('insufficient palette tone diversity');
if(!randomizerData.names.some(item=>/[А-Яа-яЁё]/.test(item.name))||!randomizerData.names.some(item=>/[A-Za-z]/.test(item.name)))failures.push('missing Cyrillic or Latin names');

const unique=field=>new Set(summaries.map(item=>item[field])).size;
console.log(JSON.stringify({generated:results.length,uniqueThemes:unique('theme'),uniqueNames:unique('name'),uniqueMoods:unique('mood'),uniqueFontPairs:unique('fontPair'),paletteTones:new Set(summaries.map(item=>item.paletteTone)).size,namePatterns:new Set(summaries.map(item=>item.namePattern)).size,moodFormats:new Set(summaries.map(item=>item.moodFormat)).size,failures},null,2));
if(failures.length)process.exitCode=1;

