import {randomizerData} from './data/randomizerData.js';

export const BRAND_HISTORY_KEY='kaliina.brand-history.v2';
export const BRAND_HISTORY_LIMIT=20;

const random=list=>list[Math.floor(Math.random()*list.length)];
const intersects=(a=[],b=[])=>a.filter(value=>b.includes(value)).length;
const normalize=value=>value.toLocaleLowerCase('ru-RU').replace(/[^a-zа-яё0-9]+/gi,' ').trim();
const words=value=>new Set(normalize(value).split(/\s+/).filter(Boolean));
const HEX_COLOR=/^#[0-9A-F]{6}$/i;
const toRgb=color=>[1,3,5].map(index=>Number.parseInt(color.slice(index,index+2),16));
const colorDistance=(left,right)=>Math.hypot(...toRgb(left).map((channel,index)=>channel-toRgb(right)[index]));

export function textSimilarity(left,right){
 const a=words(left),b=words(right);
 if(!a.size||!b.size)return 0;
 const shared=[...a].filter(word=>b.has(word)).length;
 return shared/Math.max(a.size,b.size);
}

export function isValidBrandPalette(palette){
 const colors=palette?.colors;
 if(!Array.isArray(colors)||colors.length!==4||colors.some(color=>typeof color!=='string'||!HEX_COLOR.test(color)))return false;
 const normalized=colors.map(color=>color.toUpperCase());
 if(new Set(normalized).size!==4)return false;
 return normalized.every((color,index)=>normalized.slice(index+1).every(other=>colorDistance(color,other)>=24));
}

const validPalettes=randomizerData.palettes.filter(isValidBrandPalette);
const palettePool=validPalettes.length?validPalettes:[{colors:['#2B6558','#FFF8EA','#1B1B1B','#E5A93D'],roles:['primary','background','secondary','accent'],paletteTone:'safe-fallback',tags:['clean','trust']}];
if(import.meta.env?.DEV&&validPalettes.length!==randomizerData.palettes.length)console.warn(`[brandingGenerator] Отбраковано палитр: ${randomizerData.palettes.length-validPalettes.length}`);

const itemValue=(item,field)=>field==='fontPair'?`${item.display}|${item.body}`:field==='palette'?item.colors.join('|'):item.name;
const isRecent=(item,history,field,limit)=>history.slice(0,limit).some(entry=>entry[field]===itemValue(item,field));
const isSimilar=(item,history,field,limit)=>history.slice(0,limit).some(entry=>textSimilarity(entry[field]||'',itemValue(item,field)||'')>=.67);

function weightedChoice(list,tags,{history=[],field='',recentLimit=0,similarLimit=0,metaField='',metaLimit=0,requiredTag='',contextScope=''}={}){
 let pool=list.filter(item=>!isRecent(item,history,field,recentLimit)&&!isSimilar(item,history,field,similarLimit));
 if(metaField&&metaLimit){const recentMeta=new Set(history.slice(0,metaLimit).map(entry=>entry[metaField]).filter(Boolean));const varied=pool.filter(item=>!recentMeta.has(item[metaField]));if(varied.length)pool=varied}
 if(contextScope){const compatible=pool.filter(item=>!item.scopes||item.scopes.includes(contextScope));pool=compatible.length?compatible:list.filter(item=>!item.scopes||item.scopes.includes(contextScope))}
 if(requiredTag){const contextual=pool.filter(item=>item.tags.includes(requiredTag));if(contextual.length)pool=contextual;else pool=list.filter(item=>item.tags.includes(requiredTag))}
 if(!pool.length)pool=list;
 const linked=pool.filter(item=>intersects(item.tags,tags)>0);
 if(linked.length)pool=linked;
 else{const fallback=list.filter(item=>intersects(item.tags,tags)>0);if(fallback.length)pool=fallback}
 const entries=pool.map(item=>({item,weight:1+intersects(item.tags,tags)*7}));
 let cursor=Math.random()*entries.reduce((sum,entry)=>sum+entry.weight,0);
 for(const entry of entries){cursor-=entry.weight;if(cursor<=0)return entry.item}
 return entries.at(-1)?.item||random(list);
}

export function createBrandingResult(history=[]){
 const recentThemes=new Set(history.slice(0,7).map(entry=>entry.theme));
 const recentGroups=new Set(history.slice(0,2).map(entry=>entry.group));
 let themePool=randomizerData.themes.filter(theme=>!recentThemes.has(theme.name)&&!recentGroups.has(theme.group));
 if(themePool.length<10)themePool=randomizerData.themes.filter(theme=>!recentThemes.has(theme.name));
 const theme=random(themePool.length?themePool:randomizerData.themes);
 const tags=theme.tags;
 const name=weightedChoice(randomizerData.names,tags,{history,field:'name',recentLimit:20,similarLimit:16,metaField:'namePattern',metaLimit:2,requiredTag:theme.group,contextScope:theme.scope});
 const mood=weightedChoice(randomizerData.moods,tags,{history,field:'mood',recentLimit:18,similarLimit:12,metaField:'moodFormat',metaLimit:2});
 const fonts=weightedChoice(randomizerData.fontPairs,tags,{history,field:'fontPair',recentLimit:4});
 const palette=weightedChoice(palettePool,[...new Set([...tags,...mood.tags])],{history,field:'palette',recentLimit:12,metaField:'paletteTone',metaLimit:3});
 return {theme,name,mood,fonts,palette};
}

export function summarizeBrandingResult(result){
 return {theme:result.theme.name,group:result.theme.group,name:result.name.name,namePattern:result.name.pattern,mood:result.mood.name,moodFormat:result.mood.format,fontPair:`${result.fonts.display}|${result.fonts.body}`,palette:result.palette.colors.join('|'),paletteTone:result.palette.paletteTone};
}

export function loadBrandingHistory(storage=globalThis.localStorage){
 try{const value=JSON.parse(storage?.getItem(BRAND_HISTORY_KEY)||'[]');return Array.isArray(value)?value.slice(0,BRAND_HISTORY_LIMIT):[]}catch{return []}
}

export function rememberBrandingResult(result,history,storage=globalThis.localStorage){
 const next=[summarizeBrandingResult(result),...history].slice(0,BRAND_HISTORY_LIMIT);
 try{storage?.setItem(BRAND_HISTORY_KEY,JSON.stringify(next))}catch{/* Генератор работает и при отключённом localStorage. */}
 return next;
}

export function brandingResultKey(result){
 return [result.theme.name,result.name.name,result.mood.name,result.fonts.display,result.fonts.body,result.palette.colors.join(',')].join('|');
}

