import {createBrandingResult,rememberBrandingResult,summarizeBrandingResult,textSimilarity} from '../src/brandingGenerator.js';

const memory={value:'[]',getItem(){return this.value},setItem(_key,value){this.value=value}};
let history=[];
const results=[];
for(let index=0;index<60;index+=1){
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
}

const unique=field=>new Set(summaries.map(item=>item[field])).size;
console.log(JSON.stringify({generated:results.length,uniqueThemes:unique('theme'),uniqueNames:unique('name'),uniqueMoods:unique('mood'),uniqueFontPairs:unique('fontPair'),namePatterns:new Set(summaries.map(item=>item.namePattern)).size,moodFormats:new Set(summaries.map(item=>item.moodFormat)).size,failures},null,2));
if(failures.length)process.exitCode=1;

