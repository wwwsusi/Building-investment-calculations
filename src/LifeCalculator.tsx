import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, CircleAlert, Download, Info, RefreshCcw, Scale, WalletCards } from './icons'
import { calculateLife, lifeDefaults, normalizeLifeInputs } from './lifeModel'
import type { ExistingHome, LifeInputs, LifeResult, LifeYear } from './lifeModel'

type ViewCurrency='EUR'|'CZK'
type DetailMode='basic'|'advanced'
type LifeView='model'|'compare'
type SavedScenario={id:string;name:string;savedAt:string;inputs:LifeInputs}

const draftKey='sloboda-life-draft-v1'
const scenariosKey='sloboda-life-scenarios-v1'

const tips:Record<string,string>={
  'Kurz EUR/CZK':'Koľko českých korún predstavuje jedno euro. Všetky výpočty sa interne vedú v EUR; prepínač meny mení iba zadávanie a zobrazenie.',
  'Horizont modelu':'Počet rokov, počas ktorých sledujeme hotovosť, majetok, dlhy a cash flow.',
  'Hotovosť dnes':'Všetky likvidné úspory, ktoré môžete použiť. Nezahŕňa hodnotu nehnuteľností.',
  'Presun na Slovensko':'Rok od dneška, od ktorého sa použije slovenská mzda a slovenské životné a bytové náklady.',
  'Prestať pracovať':'Vypne mzdu aj pracovné bonusy od zvoleného roku. Nájmy a iný pasívny príjem zostanú.',
  'Rok ukončenia práce':'Prvý rok bez príjmu zo zamestnania.',
  'Čistá mzda v ČR':'Pravidelný čistý mesačný príjem pred presunom a pred ukončením práce.',
  'Čistá mzda na Slovensku':'Pravidelný čistý mesačný príjem po presune a pred ukončením práce.',
  'Ročný pracovný bonus':'Čistý bonus raz ročne pred presunom. Nezadávajte ho znova do mzdy ani extra úspor.',
  'Extra mesačné úspory':'Dodatočný čistý príjem alebo úspora pred presunom nad rámec mzdy a bonusu.',
  'Osobný život v ČR':'Jedlo, doprava, voľný čas a ostatná osobná spotreba mimo bývania, nehnuteľností a úverov.',
  'Osobný život na Slovensku':'Mesačná osobná spotreba po presune mimo bývania, nehnuteľností a úverov.',
  'Iné bývanie v ČR':'Nájom alebo bývanie mimo uvedených nehnuteľností. Hypotéky a prevádzka Prahy/Berouna sa rátajú samostatne.',
  'Dočasné bývanie na Slovensku':'Nájom a služby po presune, kým nebývate vo vlastnom dome alebo rodinnom byte.',
  'Iný pasívny príjem':'Pravidelný mesačný príjem nezávislý od práce a mimo nájmov Prahy a Berouna.',
  'Trhová hodnota':'Dnešná hodnota nehnuteľnosti. Model ju bez ďalšieho rastu drží konštantnú.',
  'Zostatok hypotéky':'Nesplatená istina dnešnej hypotéky.',
  'Mesačná splátka hypotéky':'Celá mesačná splátka istiny a úroku.',
  'Úrok hypotéky':'Ročná nominálna sadzba použitá na vývoj zostatku dlhu.',
  'Mesačná prevádzka':'Energie, fond opráv, poistenie, správa a ostatné náklady vlastníka. Nezahŕňa splátku hypotéky.',
  'Prenajímať po presune':'Ak zostane nehnuteľnosť vo vlastníctve, po presune sa začne počítať zadané nájomné.',
  'Hrubé nájomné':'Mesačný príjem pred prevádzkovými nákladmi, splátkou a osobnou daňou.',
  'Predať nehnuteľnosť':'V zadanom roku sa nehnuteľnosť odstráni z majetku a čistý výnos sa pripíše k hotovosti.',
  'Rok predaja':'Rok od dneška, na začiatku ktorého sa predaj uskutoční.',
  'Predajná cena':'Očakávaná hrubá predajná cena pred províziou a splatením hypotéky.',
  'Náklady predaja':'Provízia, právne a ostatné náklady ako percento z predajnej ceny.',
  'Splatiť z hypotéky':'Percento aktuálneho zostatku hypotéky splatené pri predaji. Hodnota pod 100 % ponechá po predaji dlh a vyžaduje súhlas banky.',
  'Kúpiť bývanie na Slovensku':'Zapne kúpu bytu alebo domu ako samostatnú transakciu.',
  'Rok kúpy':'Rok od dneška, na začiatku ktorého sa kúpa uskutoční.',
  'Cena bývania':'Kúpna cena bez jednorazových vedľajších nákladov.',
  'Náklady kúpy':'Právnik, kataster, bankové poplatky, rekonštrukcia alebo zariadenie.',
  'Vlastné peniaze na kúpu':'Časť celkovej ceny zaplatená z hotovosti. Zvyšok sa automaticky modeluje ako nový úver.',
  'Splatnosť nového úveru':'Počet rokov základnej anuitnej splátky nového úveru.',
  'Kúpiť rodinný byt a vyplatiť sestru':'Zapne prevod rodinného bytu a jednorazové vyplatenie sestry.',
  'Hodnota rodinného bytu':'Hodnota aktíva, ktoré získate. Nejde o hotovostný príjem.',
  'Vyplatenie sestry':'Celková dohodnutá suma zaplatená sestre.',
  'Hotovosť na vyplatenie':'Časť vyplatenia z vašej hotovosti. Rozdiel sa automaticky modeluje ako nový úver.',
  'Bývať v rodinnom byte':'Po získaní bytu nahradí dočasné slovenské bývanie prevádzkový náklad rodinného bytu.',
  'Hotovosť po horizonte':'Zostatok likvidných peňazí po všetkých príjmoch, výdavkoch, splátkach a transakciách. Hotovosť sa nezhodnocuje.',
  'Čisté imanie po horizonte':'Hotovosť plus vlastnené nehnuteľnosti mínus všetky zostávajúce dlhy.',
  'CF po presune':'Bežný mesačný príjem mínus život, bývanie, prevádzka a splátky v prvom roku po presune. Nezahŕňa jednorazové predaje a nákupy.',
  'CF bez práce':'Mesačný výsledok po vypnutí mzdy. Kladná hodnota znamená, že pravidelné pasívne príjmy pokrývajú výdavky a splátky.',
  'Potrebná hotovosť bez práce':'Najväčší kumulovaný nedostatok od ukončenia práce do konca horizontu vrátane neskorších nákupov, pri nulovom výnose hotovosti.',
  'Hotovosť pri ukončení práce':'Modelovaný zostatok hotovosti tesne pred prvým rokom bez mzdy.',
  'Mesačná potreba bez práce':'Koľko mesačne chýba po odpočítaní nájmov a iného pasívneho príjmu od všetkých výdavkov a splátok.',
  'Výdrž hotovosti':'Počet rokov, počas ktorých by hotovosť pri ukončení práce pokrývala prvotný mesačný deficit. Neskoršie transakcie môžu výsledok zmeniť.'
}

function Tip({text}:{text:string}){return <span className="tip life-tip" tabIndex={0} aria-label={text}>?<span role="tooltip">{text}</span></span>}
function Label({children,tip}:{children:string;tip?:string}){return <>{children}<Tip text={tip||tips[children]||children}/></>}
const asNumber=(value:string)=>Math.max(0,Number(value)||0)
const deepCopy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T

function money(valueEur:number,currency:ViewCurrency,fx:number,digits=0){
  return new Intl.NumberFormat('sk-SK',{style:'currency',currency,maximumFractionDigits:digits}).format((Number.isFinite(valueEur)?valueEur:0)*(currency==='CZK'?fx:1))
}
function pct(value:number){return new Intl.NumberFormat('sk-SK',{style:'percent',maximumFractionDigits:0}).format(value)}

function MoneyField({label,value,currency,fx,onChange,tip}:{label:string;value:number;currency:ViewCurrency;fx:number;onChange:(value:number)=>void;tip?:string}){
  const multiplier=currency==='CZK'?fx:1
  return <label className="life-field"><span><Label tip={tip}>{label}</Label></span><div><input aria-label={label} type="number" min="0" step={currency==='CZK'?1000:100} value={Math.round(value*multiplier*100)/100} onChange={e=>onChange(asNumber(e.target.value)/multiplier)}/><b>{currency}</b></div></label>
}
function NumberField({label,value,onChange,unit='rok',step=1,min=0,max,tip}:{label:string;value:number;onChange:(value:number)=>void;unit?:string;step?:number;min?:number;max?:number;tip?:string}){
  return <label className="life-field"><span><Label tip={tip}>{label}</Label></span><div><input aria-label={label} type="number" min={min} max={max} step={step} value={Number.isFinite(value)?value:0} onChange={e=>onChange(Math.max(min,asNumber(e.target.value)))}/><b>{unit}</b></div></label>
}
function RateField({label,value,onChange}:{label:string;value:number;onChange:(value:number)=>void}){
  return <NumberField label={label} value={Math.round(value*10000)/100} step={.1} max={100} unit="%" onChange={v=>onChange(Math.min(1,v/100))}/>
}
function Toggle({label,checked,onChange,tip}:{label:string;checked:boolean;onChange:(checked:boolean)=>void;tip?:string}){
  return <label className="life-toggle"><span><Label tip={tip}>{label}</Label></span><button type="button" className={checked?'on':''} aria-pressed={checked} onClick={()=>onChange(!checked)}><i/>{checked?'Áno':'Nie'}</button></label>
}

function ExistingProperty({home,currency,fx,advanced,onChange}:{home:ExistingHome;currency:ViewCurrency;fx:number;advanced:boolean;onChange:(home:ExistingHome)=>void}){
  const set=<K extends keyof ExistingHome>(key:K,value:ExistingHome[K])=>onChange({...home,[key]:value})
  return <section className="life-subcard"><header><div><span>ČESKÁ NEHNUTEĽNOSŤ</span><h3>{home.label}</h3></div><Toggle label="Predať nehnuteľnosť" checked={home.sell} onChange={v=>set('sell',v)}/></header>
    <MoneyField label="Trhová hodnota" value={home.value} currency={currency} fx={fx} onChange={v=>set('value',v)}/>
    <MoneyField label="Zostatok hypotéky" value={home.debt} currency={currency} fx={fx} onChange={v=>set('debt',v)}/>
    {advanced&&<><MoneyField label="Mesačná splátka hypotéky" value={home.monthlyPayment} currency={currency} fx={fx} onChange={v=>set('monthlyPayment',v)}/><RateField label="Úrok hypotéky" value={home.annualRate} onChange={v=>set('annualRate',v)}/><MoneyField label="Mesačná prevádzka" value={home.monthlyOperating} currency={currency} fx={fx} onChange={v=>set('monthlyOperating',v)}/></>}
    {!home.sell&&<><Toggle label="Prenajímať po presune" checked={home.rentAfterMove} onChange={v=>set('rentAfterMove',v)}/>{home.rentAfterMove&&<MoneyField label="Hrubé nájomné" value={home.monthlyRent} currency={currency} fx={fx} onChange={v=>set('monthlyRent',v)}/>}</>}
    {home.sell&&<div className="life-conditional"><NumberField label="Rok predaja" value={home.saleYear} min={1} max={60} onChange={v=>set('saleYear',Math.round(v))}/><MoneyField label="Predajná cena" value={home.salePrice} currency={currency} fx={fx} onChange={v=>set('salePrice',v)}/>{advanced&&<><RateField label="Náklady predaja" value={home.saleCostRate} onChange={v=>set('saleCostRate',v)}/><RateField label="Splatiť z hypotéky" value={home.mortgagePayoffRate} onChange={v=>set('mortgagePayoffRate',v)}/></>}</div>}
  </section>
}

function phaseRow(result:LifeResult,year:number){return result.years[Math.min(result.years.length-1,Math.max(0,year))]}
function PhaseCard({title,row,currency,fx}:{title:string;row:LifeYear;currency:ViewCurrency;fx:number}){
  const fmt=(v:number)=>money(v,currency,fx)
  return <article className="life-phase-card"><header><span>{title}</span><b>{row.location} · {row.working?'pracujem':'bez práce'}</b></header><dl>
    <div className="group"><dt>PRÍJMY</dt><dd/></div>
    {row.salaryMonthly>0&&<div><dt>Čistá mzda</dt><dd>+ {fmt(row.salaryMonthly)}</dd></div>}
    {row.pragueRentMonthly>0&&<div><dt>Nájom Praha</dt><dd>+ {fmt(row.pragueRentMonthly)}</dd></div>}
    {row.berounRentMonthly>0&&<div><dt>Nájom Beroun</dt><dd>+ {fmt(row.berounRentMonthly)}</dd></div>}
    {row.otherIncomeMonthly>0&&<div><dt>Iný príjem / extra úspory</dt><dd>+ {fmt(row.otherIncomeMonthly)}</dd></div>}
    <div className="sum"><dt>Príjmy spolu</dt><dd>{fmt(row.incomeMonthly)}</dd></div>
    <div className="group expense"><dt>VÝDAVKY</dt><dd/></div>
    <div><dt>Osobný život</dt><dd>− {fmt(row.livingMonthly)}</dd></div>
    {row.housingMonthly>0&&<div><dt>Bývanie</dt><dd>− {fmt(row.housingMonthly)}</dd></div>}
    {row.pragueCostMonthly>0&&<div><dt>Prevádzka Prahy</dt><dd>− {fmt(row.pragueCostMonthly)}</dd></div>}
    {row.berounCostMonthly>0&&<div><dt>Prevádzka Berouna</dt><dd>− {fmt(row.berounCostMonthly)}</dd></div>}
    {row.praguePaymentMonthly>0&&<div><dt>Hypotéka Praha</dt><dd>− {fmt(row.praguePaymentMonthly)}</dd></div>}
    {row.berounPaymentMonthly>0&&<div><dt>Hypotéka Beroun</dt><dd>− {fmt(row.berounPaymentMonthly)}</dd></div>}
    {row.homePaymentMonthly>0&&<div><dt>Úver na bývanie SK</dt><dd>− {fmt(row.homePaymentMonthly)}</dd></div>}
    {row.familyPaymentMonthly>0&&<div><dt>Úver na vyplatenie sestry</dt><dd>− {fmt(row.familyPaymentMonthly)}</dd></div>}
    <div className="sum"><dt>Výdavky spolu</dt><dd>{fmt(row.expensesMonthly)}</dd></div>
    <div className="final"><dt>Čo mesačne zostane</dt><dd className={row.cashFlowMonthly>=0?'pos':'neg'}>{fmt(row.cashFlowMonthly)}</dd></div>
  </dl></article>
}

function LifeChart({result,currency,fx}:{result:LifeResult;currency:ViewCurrency;fx:number}){
  const width=920,height=285,left=86,right=24,top=20,bottom=38
  const values=result.years.flatMap(r=>[r.cash,r.netWorth,r.debt]),max=Math.max(1,...values),min=Math.min(0,...values),span=max-min||1
  const x=(year:number)=>left+year/Math.max(1,result.years.length-1)*(width-left-right)
  const y=(value:number)=>height-bottom-(value-min)/span*(height-top-bottom)
  const ticks=[0,.25,.5,.75,1],yearTicks=Array.from(new Set([0,5,10,15,20,25,30,result.years.length-1].filter(v=>v<result.years.length))).sort((a,b)=>a-b)
  const series=[{label:'Hotovosť',color:'#2f8264',get:(r:LifeYear)=>r.cash},{label:'Čisté imanie',color:'#6f79ad',get:(r:LifeYear)=>r.netWorth},{label:'Dlhy',color:'#b4584d',get:(r:LifeYear)=>r.debt}]
  return <div className="life-chart"><div className="trend-legend">{series.map(s=><span key={s.label}><i style={{background:s.color}}/>{s.label}</span>)}</div><div className="chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Ročný vývoj hotovosti, čistého imania a dlhov"><g className="grid">{ticks.map(t=>{const yy=top+t*(height-top-bottom),value=max-t*span;return <g key={t}><line x1={left} x2={width-right} y1={yy} y2={yy}/><text x={left-8} y={yy+4} textAnchor="end">{money(value,currency,fx)}</text></g>})}{yearTicks.map(year=><text key={year} x={x(year)} y={height-10} textAnchor="middle">{year===0?'dnes':`${year} r.`}</text>)}</g>{series.map(s=><polyline key={s.label} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={result.years.map(r=>`${x(r.year)},${y(s.get(r))}`).join(' ')}/>)}</svg></div></div>
}

function YearTable({rows,fmt}:{rows:LifeYear[];fmt:(value:number)=>string}){
  return <div className="timeline-table-wrap"><table className="timeline-table"><thead><tr><th>Rok</th><th>Miesto</th><th>Hotovosť</th><th>Nehnuteľnosti</th><th>Dlhy</th><th>Čisté imanie</th><th>Príjem / mes.</th><th>Výdavky / mes.</th><th>CF / mes.</th></tr></thead><tbody>{rows.map(row=><tr key={row.year}><th>{row.year===0?'Dnes':row.year}</th><td>{row.location}</td><td className={row.cash<0?'neg':''}>{fmt(row.cash)}</td><td>{fmt(row.propertyValue)}</td><td>{fmt(row.debt)}</td><td>{fmt(row.netWorth)}</td><td>{fmt(row.incomeMonthly)}</td><td>{fmt(row.expensesMonthly)}</td><td className={row.cashFlowMonthly>=0?'pos':'neg'}>{fmt(row.cashFlowMonthly)}</td></tr>)}</tbody></table></div>
}

export default function LifeCalculator(){
  const [inputs,setInputs]=useState<LifeInputs>(()=>{try{return normalizeLifeInputs(JSON.parse(localStorage.getItem(draftKey)||'{}'))}catch{return deepCopy(lifeDefaults)}})
  const [currency,setCurrency]=useState<ViewCurrency>('EUR')
  const [detail,setDetail]=useState<DetailMode>('basic')
  const [view,setView]=useState<LifeView>('model')
  const [scenarioName,setScenarioName]=useState('')
  const [scenarios,setScenarios]=useState<SavedScenario[]>(()=>{try{const raw=JSON.parse(localStorage.getItem(scenariosKey)||'[]');return Array.isArray(raw)?raw.slice(0,5).map((s:any)=>({...s,inputs:normalizeLifeInputs(s.inputs)})):[]}catch{return []}})
  useEffect(()=>localStorage.setItem(draftKey,JSON.stringify(inputs)),[inputs])
  useEffect(()=>localStorage.setItem(scenariosKey,JSON.stringify(scenarios)),[scenarios])
  const result=useMemo(()=>calculateLife(inputs),[inputs])
  const last=result.years[result.years.length-1],afterMove=phaseRow(result,inputs.moveYear),retirement=phaseRow(result,inputs.stopWork?inputs.stopWorkYear:inputs.horizonYears)
  const checkpointYears=new Set([0,1,inputs.moveYear,inputs.stopWork?inputs.stopWorkYear:-1,5,10,15,20,25,inputs.horizonYears])
  const checkpointRows=result.years.filter(row=>checkpointYears.has(row.year))
  const set=<K extends keyof LifeInputs>(key:K,value:LifeInputs[K])=>setInputs(current=>({...current,[key]:value}))
  const fmt=(value:number)=>money(value,currency,inputs.fx)
  const saveScenario=()=>{
    if(scenarios.length>=5)return
    const name=scenarioName.trim()||`Scenár ${scenarios.length+1}`
    setScenarios(current=>[...current,{id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,savedAt:new Date().toISOString(),inputs:deepCopy(inputs)}])
    setScenarioName('')
  }
  const reset=()=>setInputs(deepCopy(lifeDefaults))
  const exportScenario=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({schema:1,type:'life-calculator',inputs,result},null,2)],{type:'application/json'}));a.download='zivotny-model.json';a.click();URL.revokeObjectURL(a.href)}

  return <div className="page life-calculator-page">
    <div className="page-title"><span>SAMOSTATNÁ KALKULAČKA</span><h1>Životný finančný model</h1><p>Modelujte predaj bytov, presun, bývanie, vyplatenie sestry a život bez práce. Táto kalkulačka má vlastné vstupy a nemení varianty ani ostatné výpočty portálu.</p></div>
    <div className="life-toolbar panel"><div className="seg"><button className={view==='model'?'on':''} onClick={()=>setView('model')}>Kalkulačka</button><button className={view==='compare'?'on':''} onClick={()=>setView('compare')}>Porovnanie ({scenarios.length}/5)</button></div><div className="seg"><button className={currency==='EUR'?'on':''} onClick={()=>setCurrency('EUR')}>EUR</button><button className={currency==='CZK'?'on':''} onClick={()=>setCurrency('CZK')}>CZK</button></div><div className="seg"><button className={detail==='basic'?'on':''} onClick={()=>setDetail('basic')}>Základné</button><button className={detail==='advanced'?'on':''} onClick={()=>setDetail('advanced')}>Rozšírené</button></div><button className="subtle" onClick={reset}><RefreshCcw size={15}/> Obnoviť</button><button className="subtle" onClick={exportScenario}><Download size={15}/> Export</button></div>

    {view==='compare'?<ScenarioComparison scenarios={scenarios} currency={currency} fx={inputs.fx} onLoad={scenario=>{setInputs(deepCopy(scenario.inputs));setView('model')}} onDelete={id=>setScenarios(current=>current.filter(s=>s.id!==id))}/>:<>
      <section className="life-kpis">
        <article><span><Label>Hotovosť po horizonte</Label></span><strong className={last.cash<0?'neg':''}>{fmt(last.cash)}</strong><small>{inputs.horizonYears}. rok · bez výnosu hotovosti</small></article>
        <article><span><Label>Čisté imanie po horizonte</Label></span><strong>{fmt(last.netWorth)}</strong><small>hotovosť + majetok − dlhy</small></article>
        <article><span><Label>CF po presune</Label></span><strong className={afterMove.cashFlowMonthly>=0?'pos':'neg'}>{fmt(afterMove.cashFlowMonthly)}</strong><small>mesačne v {inputs.moveYear}. roku</small></article>
        <article><span><Label>CF bez práce</Label></span><strong className={retirement.cashFlowMonthly>=0?'pos':'neg'}>{inputs.stopWork?fmt(retirement.cashFlowMonthly):'nevypnutá mzda'}</strong><small>{inputs.stopWork?`od ${inputs.stopWorkYear}. roku`:'zapnite ukončenie práce'}</small></article>
      </section>

      {result.warnings.length>0&&<section className="life-warnings">{result.warnings.map(w=><div key={w}><CircleAlert size={16}/><span>{w}</span></div>)}</section>}

      <section className="life-input-columns">
        <article className="panel life-input-card"><header><span>1</span><div><h2>Dnes a časová os</h2><p>Koľko mám, kde pracujem a kedy sa mení môj život.</p></div></header>
          <MoneyField label="Hotovosť dnes" value={inputs.initialCash} currency={currency} fx={inputs.fx} onChange={v=>set('initialCash',v)}/>
          <NumberField label="Presun na Slovensko" value={inputs.moveYear} unit="rok" max={inputs.horizonYears} onChange={v=>set('moveYear',Math.round(v))}/>
          <Toggle label="Prestať pracovať" checked={inputs.stopWork} onChange={v=>set('stopWork',v)}/>
          {inputs.stopWork&&<NumberField label="Rok ukončenia práce" value={inputs.stopWorkYear} unit="rok" max={inputs.horizonYears} onChange={v=>set('stopWorkYear',Math.round(v))}/>} 
          <MoneyField label="Čistá mzda v ČR" value={inputs.salaryCz} currency={currency} fx={inputs.fx} onChange={v=>set('salaryCz',v)}/>
          <MoneyField label="Čistá mzda na Slovensku" value={inputs.salarySk} currency={currency} fx={inputs.fx} onChange={v=>set('salarySk',v)}/>
          <MoneyField label="Ročný pracovný bonus" value={inputs.annualBonusBeforeMove} currency={currency} fx={inputs.fx} onChange={v=>set('annualBonusBeforeMove',v)}/>
          <MoneyField label="Extra mesačné úspory" value={inputs.extraMonthlyBeforeMove} currency={currency} fx={inputs.fx} onChange={v=>set('extraMonthlyBeforeMove',v)}/>
          {detail==='advanced'&&<><MoneyField label="Iný pasívny príjem" value={inputs.otherPassiveIncome} currency={currency} fx={inputs.fx} onChange={v=>set('otherPassiveIncome',v)}/><NumberField label="Horizont modelu" value={inputs.horizonYears} unit="rokov" max={60} onChange={v=>set('horizonYears',Math.max(1,Math.round(v)))}/><NumberField label="Kurz EUR/CZK" value={inputs.fx} unit="CZK/EUR" step={.01} onChange={v=>set('fx',Math.max(.01,v))}/></>}
          <h3>Koľko stojí môj život</h3>
          <MoneyField label="Osobný život v ČR" value={inputs.livingCz} currency={currency} fx={inputs.fx} onChange={v=>set('livingCz',v)}/>
          <MoneyField label="Osobný život na Slovensku" value={inputs.livingSk} currency={currency} fx={inputs.fx} onChange={v=>set('livingSk',v)}/>
          <MoneyField label="Iné bývanie v ČR" value={inputs.housingCz} currency={currency} fx={inputs.fx} onChange={v=>set('housingCz',v)}/>
          <MoneyField label="Dočasné bývanie na Slovensku" value={inputs.housingSk} currency={currency} fx={inputs.fx} onChange={v=>set('housingSk',v)}/>
        </article>

        <article className="panel life-input-card"><header><span>2</span><div><h2>Praha a Beroun</h2><p>Každý byt môžem ponechať, prenajať alebo predať.</p></div></header>
          <ExistingProperty home={inputs.prague} currency={currency} fx={inputs.fx} advanced={detail==='advanced'} onChange={v=>set('prague',v)}/>
          <ExistingProperty home={inputs.beroun} currency={currency} fx={inputs.fx} advanced={detail==='advanced'} onChange={v=>set('beroun',v)}/>
        </article>

        <article className="panel life-input-card"><header><span>3</span><div><h2>Bývanie na Slovensku</h2><p>Kúpa vlastného bývania a rodinný byt sú samostatné rozhodnutia.</p></div></header>
          <section className="life-subcard"><Toggle label="Kúpiť bývanie na Slovensku" checked={inputs.slovakHome.buy} onChange={v=>set('slovakHome',{...inputs.slovakHome,buy:v})}/>{inputs.slovakHome.buy&&<div className="life-conditional"><NumberField label="Rok kúpy" value={inputs.slovakHome.year} min={1} max={inputs.horizonYears} onChange={v=>set('slovakHome',{...inputs.slovakHome,year:Math.round(v)})}/><MoneyField label="Cena bývania" value={inputs.slovakHome.price} currency={currency} fx={inputs.fx} onChange={v=>set('slovakHome',{...inputs.slovakHome,price:v})}/><MoneyField label="Vlastné peniaze na kúpu" value={inputs.slovakHome.cashContribution} currency={currency} fx={inputs.fx} onChange={v=>set('slovakHome',{...inputs.slovakHome,cashContribution:v})}/>{detail==='advanced'&&<><MoneyField label="Náklady kúpy" value={inputs.slovakHome.purchaseCosts} currency={currency} fx={inputs.fx} onChange={v=>set('slovakHome',{...inputs.slovakHome,purchaseCosts:v})}/><RateField label="Úrok nového úveru" value={inputs.slovakHome.annualRate} onChange={v=>set('slovakHome',{...inputs.slovakHome,annualRate:v})}/><NumberField label="Splatnosť nového úveru" value={inputs.slovakHome.loanYears} min={1} unit="rokov" max={40} onChange={v=>set('slovakHome',{...inputs.slovakHome,loanYears:Math.max(1,Math.round(v))})}/><MoneyField label="Mesačná prevádzka" value={inputs.slovakHome.monthlyOperating} currency={currency} fx={inputs.fx} onChange={v=>set('slovakHome',{...inputs.slovakHome,monthlyOperating:v})}/></>}</div>}</section>
          <section className="life-subcard"><Toggle label="Kúpiť rodinný byt a vyplatiť sestru" checked={inputs.familyHome.acquire} onChange={v=>set('familyHome',{...inputs.familyHome,acquire:v})}/>{inputs.familyHome.acquire&&<div className="life-conditional"><NumberField label="Rok vyplatenia sestry" value={inputs.familyHome.year} min={1} max={inputs.horizonYears} onChange={v=>set('familyHome',{...inputs.familyHome,year:Math.round(v)})}/><MoneyField label="Hodnota rodinného bytu" value={inputs.familyHome.value} currency={currency} fx={inputs.fx} onChange={v=>set('familyHome',{...inputs.familyHome,value:v})}/><MoneyField label="Vyplatenie sestry" value={inputs.familyHome.sisterPayout} currency={currency} fx={inputs.fx} onChange={v=>set('familyHome',{...inputs.familyHome,sisterPayout:v})}/><MoneyField label="Hotovosť na vyplatenie" value={inputs.familyHome.cashContribution} currency={currency} fx={inputs.fx} onChange={v=>set('familyHome',{...inputs.familyHome,cashContribution:v})}/><Toggle label="Bývať v rodinnom byte" checked={inputs.familyHome.liveThere} onChange={v=>set('familyHome',{...inputs.familyHome,liveThere:v})}/>{detail==='advanced'&&<><RateField label="Úrok nového úveru" value={inputs.familyHome.annualRate} onChange={v=>set('familyHome',{...inputs.familyHome,annualRate:v})}/><NumberField label="Splatnosť nového úveru" value={inputs.familyHome.loanYears} min={1} unit="rokov" max={40} onChange={v=>set('familyHome',{...inputs.familyHome,loanYears:Math.max(1,Math.round(v))})}/><MoneyField label="Mesačná prevádzka" value={inputs.familyHome.monthlyOperating} currency={currency} fx={inputs.fx} onChange={v=>set('familyHome',{...inputs.familyHome,monthlyOperating:v})}/></>}</div>}</section>
          <aside className="building-separate"><WalletCards size={19}/><div><b>Budova sa počíta samostatne</b><p>Nákup, úver, nájomníci, NOI a ROI zostávajú v kalkulačke Budova a nemenia tento životný model.</p></div><button onClick={()=>{location.hash='/calculator'}}>Otvoriť budovu <ArrowRight size={14}/></button></aside>
        </article>
      </section>

      <section className="panel life-results"><div className="panel-head"><div><span>MESAČNÝ ŽIVOT</span><h2>Odkiaľ prídu peniaze a kam odídu</h2><p>Jednorazové predaje a nákupy sú uvedené osobitne v transakciách.</p></div></div><div className="life-phases-grid"><PhaseCard title="Dnes / prvý rok" row={phaseRow(result,1)} currency={currency} fx={inputs.fx}/><PhaseCard title="Po presune" row={afterMove} currency={currency} fx={inputs.fx}/><PhaseCard title="Po ukončení práce" row={retirement} currency={currency} fx={inputs.fx}/></div></section>

      <section className="panel renter-panel"><div><span>ŽIVOT BEZ MZDY</span><h2>{!inputs.stopWork?'Ukončenie práce nie je zapnuté.':result.retirementGapMonthly===0?'Pravidelné príjmy pokrývajú modelované výdavky.':'Na život bez práce treba doplniť hotovostnú rezervu.'}</h2><p>Bez investičného výnosu: kalkulačka iba odpočítava budúce deficity od hotovosti.</p></div><div className="renter-kpis"><article><span><Label>Hotovosť pri ukončení práce</Label></span><b>{inputs.stopWork?fmt(result.cashAtRetirement):'—'}</b></article><article><span><Label>Mesačná potreba bez práce</Label></span><b>{inputs.stopWork?fmt(result.retirementGapMonthly):'—'}</b></article><article><span><Label>Potrebná hotovosť bez práce</Label></span><b>{inputs.stopWork?fmt(result.cashNeededAfterRetirement):'—'}</b></article><article><span><Label>Výdrž hotovosti</Label></span><b>{!inputs.stopWork?'—':result.runwayYears===null?'CF je nezáporné':`${result.runwayYears.toLocaleString('sk-SK',{maximumFractionDigits:1})} roka`}</b></article></div></section>

      <section className="panel life-timeline"><div className="panel-head"><div><span>ROČNÝ VÝVOJ</span><h2>Hotovosť, majetok a dlhy</h2><p>Hodnoty nehnuteľností a hotovosť sa nezvyšujú výnosom. Menia sa iba transakciami, príjmami, výdavkami a splácaním dlhov.</p></div></div><LifeChart result={result} currency={currency} fx={inputs.fx}/><YearTable rows={checkpointRows} fmt={fmt}/><details className="life-all-years"><summary>Ukázať každý rok</summary><YearTable rows={result.years} fmt={fmt}/></details></section>

      <section className="panel life-transactions"><div className="panel-head"><div><span>VEĽKÉ ROZHODNUTIA</span><h2>Presne čo sa predá, kúpi a z čoho</h2></div></div>{result.transactions.length?<div className="transaction-list">{result.transactions.map((t,index)=><article key={`${t.year}-${t.label}-${index}`}><b>{t.year}. rok</b><div><strong>{t.label}</strong><small>{t.detail}</small></div><span className={t.cashChange>=0?'pos':'neg'}>{t.cashChange>=0?'+ ':''}{fmt(t.cashChange)}</span></article>)}</div>:<p className="empty-state">Nie je zapnutý žiadny predaj, kúpa ani vyplatenie sestry.</p>}</section>

      <section className="panel scenario-save"><div><span>ULOŽENÉ MODELY</span><h2>Uložte si aktuálne nastavenie</h2><p>Maximálne päť scenárov. Uloženie vytvorí nezávislú kópiu vstupov.</p></div><div><input aria-label="Názov scenára" placeholder={`Scenár ${scenarios.length+1}`} value={scenarioName} onChange={e=>setScenarioName(e.target.value)}/><button disabled={scenarios.length>=5} onClick={saveScenario}><Check size={15}/>{scenarios.length>=5?'Limit 5 scenárov':'Uložiť scenár'}</button><button className="secondary" onClick={()=>setView('compare')}><Scale size={15}/> Porovnať</button></div></section>
    </>}
  </div>
}

function ScenarioComparison({scenarios,currency,fx,onLoad,onDelete}:{scenarios:SavedScenario[];currency:ViewCurrency;fx:number;onLoad:(scenario:SavedScenario)=>void;onDelete:(id:string)=>void}){
  const rows=scenarios.map(s=>({scenario:s,result:calculateLife(s.inputs)}))
  const fmtRow=(row:typeof rows[number],v:number)=>money(v,currency,row.scenario.inputs.fx||fx)
  if(!rows.length)return <section className="panel empty-compare"><Scale size={30}/><h2>Zatiaľ nemáte uložený scenár</h2><p>V kalkulačke nastavte model a použite tlačidlo „Uložiť scenár“. Porovnať môžete najviac päť možností.</p></section>
  const metrics:[string,(row:typeof rows[number])=>string][]=[
    ['Hotovosť po horizonte',r=>fmtRow(r,r.result.years.at(-1)!.cash)],
    ['Čisté imanie po horizonte',r=>fmtRow(r,r.result.years.at(-1)!.netWorth)],
    ['Hotovosť pri presune',r=>fmtRow(r,r.result.cashAtMove)],
    ['CF po presune',r=>fmtRow(r,phaseRow(r.result,r.scenario.inputs.moveYear).cashFlowMonthly)],
    ['CF bez práce',r=>r.scenario.inputs.stopWork?fmtRow(r,phaseRow(r.result,r.scenario.inputs.stopWorkYear).cashFlowMonthly):'mzda zostáva'],
    ['Potrebná hotovosť bez práce',r=>r.scenario.inputs.stopWork?fmtRow(r,r.result.cashNeededAfterRetirement):'—'],
    ['Prvý rok bez hotovosti',r=>r.result.firstNegativeYear===null?'nenastane':`${r.result.firstNegativeYear}. rok`]
  ]
  return <><section className="scenario-cards">{rows.map(row=>{const {scenario,result}=row;return <article className="panel" key={scenario.id}><span>ULOŽENÝ SCENÁR</span><h2>{scenario.name}</h2><strong className={result.years.at(-1)!.cash<0?'neg':'pos'}>{fmtRow(row,result.years.at(-1)!.cash)}</strong><small>hotovosť po {scenario.inputs.horizonYears} rokoch</small><div><button onClick={()=>onLoad(scenario)}>Načítať</button><button className="danger" onClick={()=>onDelete(scenario.id)}>Vymazať</button></div></article>})}</section><section className="panel compare-table life-compare-table"><table><thead><tr><th>Metrika</th>{rows.map(r=><th key={r.scenario.id}>{r.scenario.name}</th>)}</tr></thead><tbody>{metrics.map(([label,get])=><tr key={label}><th>{label}</th>{rows.map(r=><td key={r.scenario.id}>{get(r)}</td>)}</tr>)}</tbody></table></section></>
}
