import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {randomizerData} from './data/randomizerData.js';
import {brandingResultKey,createBrandingResult,loadBrandingHistory,rememberBrandingResult} from './brandingGenerator.js';
import {generateModelingResult,modelingRandomizerData} from './data/modelingRandomizerData.js';
import {reportClientError,startClientMonitoring} from './monitoring.js';
import './fonts.css';
import './styles.css';

const INSTAGRAM='https://www.instagram.com/kaliiii_na?igsi=MXUwbGo3b3owb3p5aQ==';
const TELEGRAM='https://t.me/kaliiiin_a';
const categories=[['theme','тематика'],['name','название'],['mood','ощущение'],['fonts','пример шрифтов'],['palette','цвета']];
const sources={theme:randomizerData.themes,name:randomizerData.names,mood:randomizerData.moods,fonts:randomizerData.fontPairs,palette:randomizerData.palettes};
const random=list=>list[Math.floor(Math.random()*list.length)];
const UNIQUE_RESULT_LIMIT=100000;
const modelingResultKey=result=>[result.object.name,result.theme.name,result.material.name,result.palette.colors.join(',')].join('|');
function createUniqueResult(factory,keyOf,onAccept=()=>{}){
 const seen=new Set();
 return ()=>{
  if(seen.size>=UNIQUE_RESULT_LIMIT)seen.clear();
  for(let attempt=0;attempt<120;attempt+=1){
   const result=factory(),key=keyOf(result);
   if(!seen.has(key)){seen.add(key);onAccept(result);return result}
  }
  seen.clear();
  const result=factory();seen.add(keyOf(result));onAccept(result);return result;
 };
}

const benefitsLeft=['помогает выйти из творческого ступора.','создаёт полноценные тренировочные брифы.','развивает концептуальное мышление','провоцирует неожиданные сочетания.','экономит время'];
const benefitsRight=['развивает умение аргументировать решения.','подходит для совместных дизайн-челленджей.','помогает создавать проекты для портфолио.'];

function Benefits({side}){const list=side==='left'?benefitsLeft:benefitsRight;return <div className={`benefits benefits--${side} intro-reveal intro-reveal--copy`}>{side==='left'&&<div className="benefits__lead"><b>[некоммерческий проект]</b><b>помощь дизайнерам:</b></div>}{list.map((text,i)=><p key={i}><strong>real:</strong><span>\</span>{text}</p>)}</div>}
function Macintosh(){return <div className="mac intro-reveal intro-reveal--mac"><img src="/assets/macintosh-cutout.png" alt="Старый компьютер Macintosh с надписью hello на экране"/><div className="crt"><i/></div></div>}
function DisplayValue({type,value}){
 if(!value)return null;
 if(type==='fonts')return <div className="font-pair"><strong style={{fontFamily:`'${value.display}', sans-serif`,fontWeight:value.displayWeight,fontStyle:value.displayStyle||'normal'}}>{value.display}</strong><span style={{fontFamily:`'${value.body}', sans-serif`,fontWeight:value.bodyWeight,fontStyle:value.bodyStyle||'normal'}}>{value.body}</span></div>;
 if(type==='palette')return <div className="palette" aria-label={`Палитра: ${value.colors.join(', ')}`}>{value.colors.map(color=><i key={color} style={{backgroundColor:color}} title={color}/>)}</div>;
 return <>{value.name}</>;
}
function RandomizerCell({index,type,label,value,generating}){const compact=['theme','name','mood'].includes(type)&&value?.name?.length>15;return <div className={`cell ${generating?'cell--rolling':''}`}><span className="cell__number">[{index+1}]</span><b className="cell__label">{label}</b><div className="cell__window"><div className={`cell__value ${compact?'cell__value--compact':''}`}><DisplayValue type={type} value={value}/></div>{generating&&<><div className="ghost ghost--one"><DisplayValue type={type} value={random(sources[type])}/></div><div className="ghost ghost--two"><DisplayValue type={type} value={random(sources[type])}/></div></>}</div></div>}

const modelingCategories=[['object','предмет\\существо'],['theme','тематика'],['material','фактура'],['palette','цветовое сочетание']];
const modelingObjects=modelingRandomizerData.objectPools.flatMap(pool=>pool.items);
const modelingSources={object:modelingObjects,theme:modelingRandomizerData.themes,material:modelingRandomizerData.materials,palette:modelingRandomizerData.palettes};
function ModelingValue({type,value}){if(!value)return null;if(type==='palette')return <div className="modeling-palette" aria-label={`Цвета: ${value.colors.join(', ')}`}>{value.colors.map(color=><i key={color} style={{backgroundColor:color}} title={color}/>)}</div>;return <>{value.name}</>}
function ModelingCell({index,type,label,value,generating}){const compact=value?.name?.length>18;return <div className={`cell modeling-cell ${generating?'cell--rolling':''}`}><span className="cell__number">[{index+1}]</span><b className="cell__label">{label}</b><div className="cell__window"><div className={`cell__value ${compact?'cell__value--compact':''}`}><ModelingValue type={type} value={value}/></div>{generating&&<><div className="ghost ghost--one"><ModelingValue type={type} value={random(modelingSources[type])}/></div><div className="ghost ghost--two"><ModelingValue type={type} value={random(modelingSources[type])}/></div></>}</div></div>}
function ModelingRandomizer(){const [values,setValues]=useState({});const [status,setStatus]=useState('initial');const [rolling,setRolling]=useState([]);const timers=useRef([]);const uniqueResult=useRef(null);if(!uniqueResult.current)uniqueResult.current=createUniqueResult(generateModelingResult,modelingResultKey);useEffect(()=>()=>timers.current.forEach(id=>clearTimeout(id)),[]);const generate=()=>{if(status==='generating')return;timers.current.forEach(id=>clearTimeout(id));const final=uniqueResult.current();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){setValues(final);setStatus('generated');return}setStatus('generating');setRolling(modelingCategories.map(([type])=>type));modelingCategories.forEach(([type],index)=>{const spin=setInterval(()=>setValues(old=>({...old,[type]:random(modelingSources[type])})),52+index*4);timers.current.push(spin);const stop=setTimeout(()=>{clearInterval(spin);setValues(old=>({...old,[type]:final[type]}));setRolling(old=>old.filter(x=>x!==type));if(index===modelingCategories.length-1)setStatus('generated')},790+index*115);timers.current.push(stop)})};return <section className="modeling-randomizer" aria-label="Генератор задания для 3Д-моделирования" aria-busy={status==='generating'}><h2 className="modeling-title">3Д моделирование</h2><div className="modeling-cells">{modelingCategories.map(([type,label],index)=><ModelingCell key={type} index={index} type={type} label={label} value={values[type]} generating={rolling.includes(type)}/>)}</div><button className="generate" onClick={generate} disabled={status==='generating'}>{status==='generated'?'ещё раз':'попробуй'}</button><span className="sr-only" aria-live="polite">{status==='generated'?'Новое задание для 3Д-моделирования сгенерировано':''}</span></section>}

function App(){
 const [values,setValues]=useState({});const [status,setStatus]=useState('initial');const [rolling,setRolling]=useState([]);const timers=useRef([]);
 const history=useRef(null);if(history.current===null)history.current=loadBrandingHistory();
 const uniqueResult=useRef(null);if(!uniqueResult.current)uniqueResult.current=createUniqueResult(()=>createBrandingResult(history.current),brandingResultKey,result=>{history.current=rememberBrandingResult(result,history.current)});
 useEffect(()=>()=>timers.current.forEach(id=>clearTimeout(id)),[]);
 const generate=()=>{if(status==='generating')return;timers.current.forEach(id=>clearTimeout(id));const final=uniqueResult.current();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduced){setValues(final);setStatus('generated');return}setStatus('generating');setRolling(categories.map(([type])=>type));categories.forEach(([type],index)=>{const spin=setInterval(()=>setValues(old=>({...old,[type]:random(sources[type])})),52+index*4);timers.current.push(spin);const stop=setTimeout(()=>{clearInterval(spin);setValues(old=>({...old,[type]:final[type]}));setRolling(old=>old.filter(x=>x!==type));if(index===categories.length-1)setStatus('generated')},790+index*115);timers.current.push(stop)})};
 return <main>
  <section className="intro">
    <div className="intro__left"><h1 className="intro-reveal intro-reveal--title">Generator T3</h1><Benefits side="left"/></div>
    <div className="intro__center"><Macintosh/></div>
    <div className="intro__right"><a className="author intro-reveal intro-reveal--author" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">@kaliiii_na</a><Benefits side="right"/></div>
  </section>
  <section className="randomizer intro-reveal intro-reveal--randomizer" aria-label="Генератор технического задания" aria-busy={status==='generating'}>
   <h2 className="modeling-title">Фирменный стиль</h2>
   <div className="cells">{categories.map(([type,label],index)=><RandomizerCell key={type} index={index} type={type} label={label} value={values[type]} generating={rolling.includes(type)}/>)}</div>
   <button className="generate" onClick={generate} disabled={status==='generating'}>{status==='generated'?'ещё раз':'попробуй'}</button>
   <span className="sr-only" aria-live="polite">{status==='generated'?'Новое задание сгенерировано':''}</span>
  </section>
  <ModelingRandomizer/>
  <footer className="footer intro-reveal intro-reveal--footer">
   <div className="footer__copy"><p>Если вы заметили ошибки в работе рандомайзера, столкнулись с некорректной генерацией или хотите поделиться замечаниями и предложениями по улучшению проекта — буду рада обратной связи.<br/>Также вы можете связаться со мной по вопросам сотрудничества, совместных проектов и других предложений.</p><b>контакты:</b><nav aria-label="Контакты"><a href="mailto:klina2708@gmail.com">real: klina2708@gmail.com</a><a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">real: inst: kaliiii_na</a><a href={TELEGRAM} target="_blank" rel="noopener noreferrer">tg: kaliiiin_a</a></nav><p className="thanks">Спасибо, что заглянули на этот сайт и уделили время проекту. Мне очень приятно, что рандомайзер может быть вам интересен или полезен. Если вы хотите поддержать автора, просто поделитесь сайтом с друзьями, коллегами или сделайте репост в социальных сетях. Для независимого некоммерческого проекта такая поддержка действительно много значит.</p></div>
   <aside className="statistics" aria-label="Статистика проекта">
    <div className="statistics__item"><div className="statistics__value-row"><span className="statistics__value">100 000</span><span className="statistics__unit">тыс.</span></div><div className="statistics__label">комбинаций</div></div>
    <div className="statistics__item"><div className="statistics__value-row"><span className="statistics__value">65–75</span><span className="statistics__unit">тыс.</span></div><div className="statistics__label">загрузок в месяц</div></div>
   </aside>
  </footer>
 </main>}
startClientMonitoring();
createRoot(document.getElementById('root'),{
 onUncaughtError:error=>reportClientError(error,{kind:'react.uncaught'}),
 onCaughtError:error=>reportClientError(error,{kind:'react.caught'}),
 onRecoverableError:error=>reportClientError(error,{kind:'react.recoverable'}),
}).render(<App/>);

