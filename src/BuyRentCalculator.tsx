import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CircleAlert, Info, Landmark, RefreshCcw, Scale, ShieldCheck, WalletCards } from './icons'
import { atYear, buyRentDefaults, calculateBuyRent, normalizeBuyRentInputs, purchaseCostsTotal } from './buyRentModel'
import type { BuyRentInputs, BuyRentMonth, BuyRentPurchaseCosts } from './buyRentModel'

type Mode='simple'|'advanced'
type InputStatus='CONFIRMED'|'ESTIMATE'|'TBD'|'SCENARIO'|'DERIVED'
const eur=new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR',maximumFractionDigits:0})
const num=new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1})
const pct=(value:number)=>`${num.format(value*100)} %`
const STORAGE='sloboda-buy-rent-v1'

function loadInputs(){try{return normalizeBuyRentInputs(JSON.parse(localStorage.getItem(STORAGE)||'{}'))}catch{return buyRentDefaults}}

export default function BuyRentCalculator(){
 const [mode,setMode]=useState<Mode>('simple')
 const [inputs,setInputs]=useState<BuyRentInputs>(loadInputs)
 const [horizon,setHorizon]=useState(inputs.horizonYears)
 const [sensitivityExtra,setSensitivityExtra]=useState(10000)
 useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(inputs)),[inputs])
 const modelInputs=useMemo(()=>normalizeBuyRentInputs({...inputs,horizonYears:Math.max(15,horizon)}),[inputs,horizon])
 const result=useMemo(()=>calculateBuyRent(modelInputs),[modelInputs])
 const current=atYear(result,horizon)
 const scenarios=useMemo(()=>[0,10000,20000].map(extra=>({extra,result:calculateBuyRent({...modelInputs,annualExtraPayment:extra})})),[modelInputs])
 const update=<K extends keyof BuyRentInputs>(key:K,value:BuyRentInputs[K])=>setInputs(old=>normalizeBuyRentInputs({...old,[key]:value}))
 const reset=()=>{setInputs(buyRentDefaults);setHorizon(15);localStorage.removeItem(STORAGE)}
 const payoff=result.payoffMonth===null?'Nesplatený':result.payoffMonth===0?'Bez úveru':`${num.format(result.payoffMonth/12)} roka`
 const breakEven=result.breakEvenMonth===null?'Mimo horizontu':result.breakEvenMonth===0?'Okamžite':`${num.format(result.breakEvenMonth/12)} roka`
 const decision=current.advantage>=0?'Kúpa vytvára viac čistého majetku':'Nájom + investovanie vytvára viac čistého majetku'
 const ownershipMonthly=modelInputs.insuranceAnnual/12+(modelInputs.useAreaTax?modelInputs.areaM2*modelInputs.taxPerM2:modelInputs.propertyTaxAnnual)/12+modelInputs.repairFundMonthly+modelInputs.adminMonthly+modelInputs.otherOwnershipAnnual/12
 const commonMonthly=inputs.commonUtilitiesMonthly+inputs.waterSewerMonthly+inputs.heatingMonthly+inputs.otherCommonMonthly
 const buyMonthly=(result.months[1]?.regularPayment||0)+ownershipMonthly+inputs.reserveMonthly+commonMonthly+inputs.annualExtraPayment/12
 const rentMonthly=inputs.rentMonthly+commonMonthly
 return <div className="bvr-page">
  <section className="bvr-head">
   <div><span>ROZHODOVACÍ MODEL LADY FITNESS</span><h1>Kúpa priestoru vs nájom</h1><p>Porovnanie dvoch ciest pri rovnakom počiatočnom kapitále a rovnakom mesačnom rozpočte.</p></div>
   <div className="bvr-mode" role="group" aria-label="Režim kalkulačky"><button className={mode==='simple'?'on':''} onClick={()=>setMode('simple')}>Simple<small>rozhodujúce vstupy</small></button><button className={mode==='advanced'?'on':''} onClick={()=>setMode('advanced')}>Advanced<small>celá ekonomika</small></button></div>
  </section>
  <section className="bvr-data-status"><ShieldCheck size={17}/><div><b>Pracovný scenár zo synchronizovaných dokumentov</b><p><span className="confirmed">CONFIRMED</span> je overený údaj, <span className="estimate">ESTIMATE</span> pracovný odhad, <span className="scenario">SCENARIO</span> modelová voľba a <span className="tbd">TBD</span> zatiaľ neznámy údaj. TBD sa vo výpočte používa ako 0 €, kým ho používateľ vedome nedoplní.</p></div></section>

  <section className="bvr-controls panel">
   <div className="bvr-section-title"><div><span>VSTUPY</span><h2>{mode==='simple'?'Rýchle porovnanie':'Detailný investičný model'}</h2></div><button className="bvr-reset" onClick={reset}><RefreshCcw size={14}/> Obnoviť Lady Fitness</button></div>
   <div className="bvr-input-grid">
    <div className="bvr-input-group"><h3>1. Kúpa a financovanie</h3>
     <Field label="Cena nehnuteľnosti" status="ESTIMATE" tip="Kúpna cena priestoru bez vedľajších nákladov." value={inputs.price} unit="€" onChange={v=>update('price',v)}/>
     <Field label="Vlastné peniaze" status="CONFIRMED" tip="Hotovosť vložená do kúpnej ceny. V alternatíve nájmu sa rovnaká suma investuje." value={inputs.ownFunds} unit="€" onChange={v=>update('ownFunds',v)}/>
     <Toggle label="Úver dopočítať automaticky" tip="Úver = cena nehnuteľnosti mínus vlastné peniaze." value={inputs.autoLoan} onChange={v=>update('autoLoan',v)}/>
     <Field label="Výška úveru" status={inputs.autoLoan?'DERIVED':'SCENARIO'} tip="Istina úveru. Pri automatickom režime sa mení s cenou a vlastnými peniazmi." value={inputs.loan} unit="€" disabled={inputs.autoLoan} onChange={v=>update('loan',v)}/>
     <Field label="Úrok" status="ESTIMATE" tip="Nominálna ročná úroková sadzba. Splátka sa počíta mesačnou anuitou." value={inputs.annualRate*100} unit="% p.a." step={.1} onChange={v=>update('annualRate',v/100)}/>
     <Field label="Splatnosť" status="ESTIMATE" tip="Pôvodná doba splácania úveru." value={inputs.loanYears} unit="rokov" onChange={v=>update('loanYears',v)}/>
     <Field label="Mimoriadna splátka" status="SCENARIO" tip="Suma zaplatená na konci každého roka priamo do istiny." value={inputs.annualExtraPayment} unit="€/rok" onChange={v=>update('annualExtraPayment',v)}/>
    </div>
    <div className="bvr-input-group"><h3>2. Nájom a rast</h3>
     <Field label="Dnešný nájom" status="CONFIRMED" tip="Mesačný nájom za porovnateľný priestor. Energie sa zadávajú samostatne." value={inputs.rentMonthly} unit="€/mes." onChange={v=>update('rentMonthly',v)}/>
     <Field label="Rast nájmu" status="ESTIMATE" tip="O koľko sa nájom priemerne zvýši každý rok." value={inputs.rentGrowth*100} unit="% p.a." step={.1} onChange={v=>update('rentGrowth',v/100)}/>
     <Field label="Rast hodnoty nehnuteľnosti" status="ESTIMATE" tip="Očakávaný priemerný ročný rast ceny. Nie je garantovaný." value={inputs.propertyGrowth*100} unit="% p.a." step={.1} onChange={v=>update('propertyGrowth',v/100)}/>
     <Field label="Horizont rozhodnutia" tip="Rok, ku ktorému porovnávame výsledný čistý majetok." value={horizon} unit="rokov" min={1} max={60} onChange={setHorizon}/>
     <div className="bvr-horizons">{[1,5,10,15].map(year=><button key={year} className={horizon===year?'on':''} onClick={()=>setHorizon(year)}>{year} r.</button>)}</div>
     <div className="bvr-mini-summary"><span>Pravidelná splátka<Tip text="Základná anuitná splátka bez mimoriadnych splátok."/></span><b>{eur.format(result.months[1]?.regularPayment||0)} / mes.</b><span>Fixné vlastnícke náklady<Tip text="Poistka, daň, fond opráv, správa a iné náklady; bez rezervy, energií a splátky."/></span><b>{eur.format(ownershipMonthly)} / mes.</b></div>
    </div>
    {mode==='advanced'&&<div className="bvr-input-group"><h3>3. Náklady vlastníctva</h3>
     <Field label="Poistenie" status="ESTIMATE" tip="Ročné poistné za nehnuteľnosť." value={inputs.insuranceAnnual} unit="€/rok" onChange={v=>update('insuranceAnnual',v)}/>
     <Toggle label="Daň podľa plochy" tip="Namiesto priamej ročnej dane použije plocha × sadzba." value={inputs.useAreaTax} onChange={v=>update('useAreaTax',v)}/>
     {inputs.useAreaTax?<><Field label="Plocha" status="TBD" value={inputs.areaM2} unit="m²" onChange={v=>update('areaM2',v)}/><Field label="Daň za m²" status="TBD" value={inputs.taxPerM2} unit="€/rok" step={.1} onChange={v=>update('taxPerM2',v)}/></>:<Field label="Daň z nehnuteľnosti" status="ESTIMATE" value={inputs.propertyTaxAnnual} unit="€/rok" onChange={v=>update('propertyTaxAnnual',v)}/>} 
     <Field label="Fond opráv" status="ESTIMATE" tip="Pravidelný príspevok správcovi alebo spoločenstvu." value={inputs.repairFundMonthly} unit="€/mes." onChange={v=>update('repairFundMonthly',v)}/>
     <Field label="Správa" status="TBD" value={inputs.adminMonthly} unit="€/mes." onChange={v=>update('adminMonthly',v)}/>
     <Field label="Iné vlastnícke náklady" status="TBD" value={inputs.otherOwnershipAnnual} unit="€/rok" onChange={v=>update('otherOwnershipAnnual',v)}/>
     <Field label="Elektrina" status="ESTIMATE" tip="Spoločný prevádzkový náklad oboch možností; v rozdiele sa vyruší." value={inputs.commonUtilitiesMonthly} unit="€/mes." onChange={v=>update('commonUtilitiesMonthly',v)}/>
     <Field label="Voda a kanalizácia" status="TBD" value={inputs.waterSewerMonthly} unit="€/mes." onChange={v=>update('waterSewerMonthly',v)}/>
     <Field label="Kúrenie" status="TBD" value={inputs.heatingMonthly} unit="€/mes." onChange={v=>update('heatingMonthly',v)}/>
     <Field label="Ostatné spoločné náklady" status="TBD" value={inputs.otherCommonMonthly} unit="€/mes." onChange={v=>update('otherCommonMonthly',v)}/>
    </div>}
   </div>
   {mode==='advanced'&&<AdvancedInputs inputs={inputs} update={update}/>} 
  </section>

  {result.financingBalance<0&&<div className="bvr-warning"><CircleAlert size={17}/><span>Na kúpnu cenu chýba <b>{eur.format(-result.financingBalance)}</b>. Zvýšte úver alebo vlastné peniaze.</span></div>}

  <section className="bvr-monthly panel"><div><span>DNEŠNÝ PRIEMERNÝ MESAČNÝ CASH FLOW</span><h2>Koľko odchádza z účtu</h2><p>BUY zahŕňa splátku, priemer mimoriadnej splátky, fixné náklady, rezervu a spoločné energie.</p></div><div><article><small>BUY</small><b>{eur.format(buyMonthly)} / mes.</b><em>splátka {eur.format(result.months[1]?.regularPayment||0)} + extra {eur.format(inputs.annualExtraPayment/12)} + ostatné {eur.format(ownershipMonthly+inputs.reserveMonthly+commonMonthly)}</em></article><article><small>RENT</small><b>{eur.format(rentMonthly)} / mes.</b><em>nájom {eur.format(inputs.rentMonthly)} + energie {eur.format(commonMonthly)}</em></article><i>= rozdiel {eur.format(Math.abs(buyMonthly-rentMonthly))} / mes. investuje lacnejšia cesta</i></div></section>

  <section className="bvr-kpis">
   <Metric icon={Landmark} label={`Hodnota o ${horizon} r.`} value={eur.format(current.propertyValue)} note={`rast ${pct(inputs.propertyGrowth)} ročne`} tip="Odhad ceny pri zadanom raste; nejde o garantovanú trhovú hodnotu."/>
   <Metric icon={WalletCards} label="Zostatok úveru" value={eur.format(current.loanBalance)} note={`splatené ${eur.format(inputs.loan-current.loanBalance)}`} tip="Nesplatená istina ku zvolenému roku."/>
   <Metric icon={ShieldCheck} label="Vlastný kapitál" value={eur.format(current.equity)} note="hodnota mínus úver" tip="Čistá hodnota nehnuteľnosti po odpočítaní zostatku úveru."/>
   <Metric icon={Scale} label="Rozdiel BUY vs RENT" value={eur.format(current.advantage)} note={current.advantage>=0?'v prospech kúpy':'v prospech nájmu'} tip="Rozdiel celkového čistého majetku pri rovnakom štartovacom kapitále a mesačnom rozpočte." tone={current.advantage>=0?'good':'bad'}/>
  </section>

  <section className="bvr-decision panel">
   <div className={current.advantage>=0?'good':'bad'}><span>VÝSLEDOK V ROKU {horizon}</span><h2>{decision}</h2><p>Rozdiel je <b>{eur.format(Math.abs(current.advantage))}</b>. Model zahŕňa rast ceny a nájmu, financovanie, vlastnícke náklady a investovanie rozdielu mesačných výdavkov.</p></div>
   <dl><div><dt>Kúpa – čistý majetok<Tip text="Vlastný kapitál v nehnuteľnosti + nevyčerpaná rezerva + investovaný prebytok cash flow."/></dt><dd>{eur.format(current.buyWealth)}</dd></div><div><dt>{inputs.includeOpportunityCost?'Nájom + investovanie':'Nájom – hotovosť'}<Tip text="Nevložený kapitál a mesačné úspory nájomnej alternatívy. Výnos sa použije iba ak je zapnutá alternatívna investícia."/></dt><dd>{eur.format(current.rentWealth)}</dd></div><div><dt>Break-even<Tip text="Prvý čas, keď čistý majetok kúpy dosiahne alebo prekoná alternatívu nájmu."/></dt><dd>{breakEven}</dd></div><div><dt>Úver splatený</dt><dd>{payoff}</dd></div></dl>
  </section>

  <section className="bvr-ledgers">
   <article className="panel"><header><span>BUY</span><h2>Kúpim priestor</h2></header><Ledger rows={[
    ['Hodnota nehnuteľnosti',current.propertyValue],['− Zostatok úveru',-current.loanBalance],['= Vlastný kapitál',current.equity,'sum'],['Nevyčerpaná rezerva',current.reserveBalance],['Investovaný prebytok cash flow',current.buyInvestment],['Čistý majetok BUY',current.buyWealth,'total']
   ]}/><small>Hotovostné výdavky spolu: {eur.format(current.cumulativeBuyCashOutflow)} · z toho úrok {eur.format(current.cumulativeInterest)} a CAPEX {eur.format(current.cumulativeCapex)}.</small></article>
   <article className="panel"><header><span>RENT + INVEST</span><h2>Pokračujem v nájme</h2></header><Ledger rows={[
    ['Počiatočný investovaný kapitál',inputs.ownFunds+result.purchaseCostsTotal],['Nájom zaplatený za obdobie',-current.cumulativeRent],['Hodnota investičnej alternatívy',current.rentWealth,'sum'],['Rozdiel oproti kúpe',-current.advantage,'total']
   ]}/><small>Každý mesiac sa investuje tá časť rovnakého rozpočtu, ktorú táto alternatíva nemusela minúť.</small></article>
  </section>

  <section className="panel bvr-table-panel"><div className="bvr-section-title"><div><span>KONTROLNÉ BODY</span><h2>Čo sa mení v čase</h2></div></div><ComparisonTable result={result} years={Array.from(new Set([1,5,10,15,horizon])).sort((a,b)=>a-b)}/></section>

  <section className="bvr-charts">
   <Chart title="Majetok a úver" subtitle="Hodnota nehnuteľnosti, vlastný kapitál a nesplatená istina" series={[['Hodnota',result.months.map(x=>x.propertyValue),'#176846'],['Vlastný kapitál',result.months.map(x=>x.equity),'#7d9c35'],['Úver',result.months.map(x=>x.loanBalance),'#bb705c']]} months={result.months}/>
   <Chart title="Kúpa vs nájom + investovanie" subtitle="Porovnateľný čistý majetok oboch možností" series={[['BUY',result.months.map(x=>x.buyWealth),'#176846'],['RENT + INVEST',result.months.map(x=>x.rentWealth),'#71829a']]} months={result.months}/>
   {mode==='advanced'&&<Chart title="Vplyv mimoriadnych splátok" subtitle="Zostatok istiny pri troch stratégiách" series={scenarios.map(({extra,result:r},index)=>[`${eur.format(extra)}/rok`,r.months.map(x=>x.loanBalance),['#9eada5','#7d9c35','#176846'][index]] as [string,number[],string])} months={result.months}/>} 
  </section>

  {mode==='advanced'&&<AdvancedResults inputs={modelInputs} result={result} scenarios={scenarios} sensitivityExtra={sensitivityExtra} setSensitivityExtra={setSensitivityExtra}/>} 

  <section className="bvr-method panel"><Info size={18}/><div><b>Ako čítať výsledok</b><p>Istina úveru nie je ekonomický náklad: mení hotovosť na vlastný kapitál. Rezerva zostáva vaším majetkom, kým sa reálne neminie. Spoločné energie sú v cash flow oboch možností, ale neovplyvňujú ich rozdiel. Výsledok je model, nie cenová ponuka banky ani garancia výnosu.</p></div></section>
 </div>
}

function AdvancedInputs({inputs,update}:{inputs:BuyRentInputs;update:<K extends keyof BuyRentInputs>(key:K,value:BuyRentInputs[K])=>void}){
 const costs=inputs.purchaseCosts
 const setCost=(key:keyof BuyRentPurchaseCosts,value:number)=>update('purchaseCosts',{...costs,[key]:Math.max(0,value)})
 const addCapex=()=>update('capex',[...inputs.capex,{id:crypto.randomUUID(),label:`Investícia ${inputs.capex.length+1}`,year:5,totalCost:0,share:1}])
 return <div className="bvr-advanced">
  <article><h3>4. Rezerva a alternatívny výnos</h3><Field label="Rezerva na opravy" status="ESTIMATE" tip="Odkladaná hotovosť; neminutá časť ostáva aktívom." value={inputs.reserveMonthly} unit="€/mes." onChange={v=>update('reserveMonthly',v)}/><Field label="Koľko rezervy sa minie" status="SCENARIO" tip="Len minutá časť je ekonomický náklad." value={inputs.reserveSpendRate*100} unit="%" onChange={v=>update('reserveSpendRate',v/100)}/><Toggle label="Rent + Invest" tip="Nevložený kapitál a mesačný rozdiel nákladov sa investujú." value={inputs.includeOpportunityCost} onChange={v=>update('includeOpportunityCost',v)}/><Field label="Výnos alternatívnej investície" status="SCENARIO" value={inputs.alternativeReturn*100} unit="% p.a." step={.1} disabled={!inputs.includeOpportunityCost} onChange={v=>update('alternativeReturn',v/100)}/><Field label="Mesiac mimoriadnej splátky" status="SCENARIO" value={inputs.extraPaymentMonth} unit="1–12" min={1} max={12} onChange={v=>update('extraPaymentMonth',v)}/></article>
  <article><h3>5. Náklady na kúpu <Status value="ESTIMATE"/><small>{eur.format(purchaseCostsTotal(costs))}</small></h3>{([['appraisal','Odhad'],['legal','Právnik'],['cadastre','Kataster'],['bank','Banka'],['inspection','Technická kontrola'],['project','Projekt'],['division','Rozdelenie priestoru'],['other','Ostatné']] as [keyof BuyRentPurchaseCosts,string][]).map(([key,label])=><Field key={key} label={label} value={costs[key]} unit="€" onChange={v=>setCost(key,v)}/>)}</article>
  <article className="bvr-capex"><div className="bvr-capex-head"><h3>6. Jednorazový CAPEX <Status value="TBD"/></h3><button onClick={addCapex}>+ Pridať</button></div>{inputs.capex.length===0?<p>Strecha a ďalší CAPEX sú zatiaľ TBD. Do výsledku sa započítajú až po vedomom pridaní sumy, roku a podielu Lady Fitness.</p>:inputs.capex.map(item=><div className="bvr-capex-row" key={item.id}><input aria-label="Názov CAPEX" value={item.label} onChange={e=>update('capex',inputs.capex.map(x=>x.id===item.id?{...x,label:e.target.value}:x))}/><label>rok<input type="number" min="1" value={item.year} onChange={e=>update('capex',inputs.capex.map(x=>x.id===item.id?{...x,year:Number(e.target.value)}:x))}/></label><label>cena<input type="number" min="0" value={item.totalCost} onChange={e=>update('capex',inputs.capex.map(x=>x.id===item.id?{...x,totalCost:Number(e.target.value)}:x))}/></label><label>môj podiel<input type="number" min="0" max="100" value={item.share*100} onChange={e=>update('capex',inputs.capex.map(x=>x.id===item.id?{...x,share:Number(e.target.value)/100}:x))}/></label><button aria-label="Odstrániť CAPEX" onClick={()=>update('capex',inputs.capex.filter(x=>x.id!==item.id))}>×</button></div>)}</article>
  <article className="bvr-unknowns"><h3>Neznáme údaje, ktoré môžu zmeniť výsledok</h3><ul><li><Status value="TBD"/> presná kupovaná plocha</li><li><Status value="TBD"/> podiel Lady Fitness na spoločných nákladoch</li><li><Status value="TBD"/> strecha a ďalší CAPEX</li><li><Status value="TBD"/> právne rozdelenie, prístup a technická samostatnosť</li></ul><p>Tieto riziká zatiaľ nemajú potvrdenú sumu, preto nie sú skryto započítané. Pred rozhodnutím treba model doplniť.</p></article>
 </div>
}

function AdvancedResults({inputs,result,scenarios,sensitivityExtra,setSensitivityExtra}:{inputs:BuyRentInputs;result:ReturnType<typeof calculateBuyRent>;scenarios:{extra:number;result:ReturnType<typeof calculateBuyRent>}[];sensitivityExtra:number;setSensitivityExtra:(n:number)=>void}){
 const year=inputs.horizonYears,current=atYear(result,year)
 const growths=[0,.01,.025,.04,.05],rentGrowths=[0,.02,.03,.05]
 return <>
  <section className="panel bvr-table-panel"><div className="bvr-section-title"><div><span>DLHOVÁ STRATÉGIA</span><h2>Mimoriadne splátky</h2></div></div><div className="bvr-scroll"><table><thead><tr><th>Ročná mimoriadna splátka</th><th>Úver splatený</th><th>Úroky spolu</th><th>Ušetrený úrok</th><th>Majetok v roku {year}</th></tr></thead><tbody>{scenarios.map(({extra,result:r})=>{const p=r.payoffMonth;return <tr key={extra}><th>{eur.format(extra)}</th><td>{p===null?'nesplatený':p===0?'bez úveru':`${num.format(p/12)} r.`}</td><td>{eur.format(r.interestWithExtra)}</td><td>{eur.format(r.interestSaved)}</td><td>{eur.format(atYear(r,year).buyWealth)}</td></tr>})}</tbody></table></div><p className="bvr-note">Mimoriadna splátka znižuje úrok a dlh, ale odoberá hotovosť, ktorá by sa mohla investovať. Preto najnižší úrok nemusí automaticky znamenať najvyšší čistý majetok.</p></section>
  <section className="panel bvr-sensitivity"><div className="bvr-section-title"><div><span>CITLIVOSŤ VÝSLEDKU</span><h2>Kedy vyhráva kúpa</h2></div><div className="bvr-tabs">{[0,10000,20000].map(x=><button className={sensitivityExtra===x?'on':''} onClick={()=>setSensitivityExtra(x)} key={x}>{eur.format(x)}/rok</button>)}</div></div><div className="bvr-scroll"><table><thead><tr><th>Rast nájmu ↓ / rast ceny →</th>{growths.map(g=><th key={g}>{pct(g)}</th>)}</tr></thead><tbody>{rentGrowths.map(rg=><tr key={rg}><th>{pct(rg)}</th>{growths.map(pg=>{const r=calculateBuyRent({...inputs,annualExtraPayment:sensitivityExtra,propertyGrowth:pg,rentGrowth:rg});const advantage=atYear(r,year).advantage;return <td className={advantage>=0?'pos':'neg'} key={pg}>{advantage>=0?'+':''}{eur.format(advantage)}</td>})}</tr>)}</tbody></table></div><p className="bvr-note">Bunky ukazujú rozdiel čistého majetku BUY − RENT + INVEST v roku {year}. Zelená znamená výhodu kúpy.</p></section>
  <section className="bvr-story panel"><ArrowRight size={18}/><div><b>Rozhodovací záver podľa aktuálnych vstupov</b><p>Za {year} rokov bude vlastný kapitál v priestore {eur.format(current.equity)}. Nájom zaplatený za rovnaké obdobie dosiahne {eur.format(current.cumulativeRent)}. Po započítaní alternatívneho výnosu, vlastníckych nákladov, CAPEX a investovania mesačného rozdielu je {current.advantage>=0?'kúpa':'nájom + investovanie'} vpredu o {eur.format(Math.abs(current.advantage))}. Najcitlivejšie predpoklady sú rast hodnoty, rast nájmu a alternatívny výnos.</p></div></section>
 </>
}

function Field({label,tip,status,value,unit,onChange,disabled=false,step=1,min=0,max}:{label:string;tip?:string;status?:InputStatus;value:number;unit:string;onChange:(v:number)=>void;disabled?:boolean;step?:number;min?:number;max?:number}){return <label className={`bvr-field ${disabled?'disabled':''}`}><span>{label}{tip&&<Tip text={tip}/>} {status&&<Status value={status}/>}</span><div><input type="number" value={Number.isFinite(value)?value:0} step={step} min={min} max={max} disabled={disabled} onChange={e=>onChange(Number(e.target.value))}/><b>{unit}</b></div></label>}
function Status({value}:{value:InputStatus}){return <small className={`bvr-status ${value.toLowerCase()}`}>{value}</small>}
function Toggle({label,tip,value,onChange}:{label:string;tip?:string;value:boolean;onChange:(v:boolean)=>void}){return <label className="bvr-toggle"><span>{label}{tip&&<Tip text={tip}/>}</span><button className={value?'on':''} onClick={()=>onChange(!value)} type="button"><i/>{value?'Áno':'Nie'}</button></label>}
function Tip({text}:{text:string}){return <span className="bvr-tip" tabIndex={0} aria-label={text}>?<i>{text}</i></span>}
function Metric({icon:Icon,label,value,note,tip,tone}:{icon:typeof Landmark;label:string;value:string;note:string;tip:string;tone?:'good'|'bad'}){return <article className={`panel ${tone||''}`}><Icon size={18}/><div><span>{label}<Tip text={tip}/></span><strong>{value}</strong><small>{note}</small></div></article>}
function Ledger({rows}:{rows:[string,number,('sum'|'total')?][]}){return <dl className="bvr-ledger">{rows.map(([label,value,kind],index)=><div className={kind||''} key={`${label}-${index}`}><dt>{label}</dt><dd className={value<0?'neg':''}>{value<0?'− ':''}{eur.format(Math.abs(value))}</dd></div>)}</dl>}
function ComparisonTable({result,years}:{result:ReturnType<typeof calculateBuyRent>;years:number[]}){return <div className="bvr-scroll"><table><thead><tr><th>Ukazovateľ</th>{years.map(y=><th key={y}>{y}. rok</th>)}</tr></thead><tbody><TableRow label="Hodnota nehnuteľnosti" values={years.map(y=>atYear(result,y).propertyValue)}/><TableRow label="Zostatok úveru" values={years.map(y=>atYear(result,y).loanBalance)}/><TableRow label="Vlastný kapitál" values={years.map(y=>atYear(result,y).equity)}/><TableRow label="Zaplatený nájom" values={years.map(y=>atYear(result,y).cumulativeRent)}/><TableRow label="Čistý majetok BUY" values={years.map(y=>atYear(result,y).buyWealth)} strong/><TableRow label="Čistý majetok RENT + INVEST" values={years.map(y=>atYear(result,y).rentWealth)} strong/><TableRow label="Rozdiel BUY − RENT" values={years.map(y=>atYear(result,y).advantage)} signed strong/></tbody></table></div>}
function TableRow({label,values,strong,signed}:{label:string;values:number[];strong?:boolean;signed?:boolean}){return <tr className={strong?'strong':''}><th>{label}</th>{values.map((v,i)=><td className={signed?(v>=0?'pos':'neg'):''} key={i}>{signed&&v>=0?'+':''}{eur.format(v)}</td>)}</tr>}

type Series=[string,number[],string]
function Chart({title,subtitle,series,months}:{title:string;subtitle:string;series:Series[];months:BuyRentMonth[]}){
 const width=720,height=240,pad={l:52,r:14,t:16,b:32},values=series.flatMap(s=>s[1]),max=Math.max(1,...values),min=Math.min(0,...values),range=max-min||1
 const x=(index:number,length:number)=>pad.l+(index/Math.max(1,length-1))*(width-pad.l-pad.r)
 const y=(value:number)=>pad.t+(1-(value-min)/range)*(height-pad.t-pad.b)
 const ticks=[0,.25,.5,.75,1]
 return <article className="panel bvr-chart"><h2>{title}</h2><p>{subtitle}</p><div className="bvr-legend">{series.map(([name,,color])=><span key={name}><i style={{background:color}}/>{name}</span>)}</div><div className="bvr-chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>{ticks.map(t=>{const value=min+(max-min)*(1-t);return <g key={t}><line x1={pad.l} x2={width-pad.r} y1={pad.t+t*(height-pad.t-pad.b)} y2={pad.t+t*(height-pad.t-pad.b)} stroke="var(--line)"/><text x={pad.l-8} y={pad.t+t*(height-pad.t-pad.b)+3} textAnchor="end">{compact(value)}</text></g>})}{series.map(([name,data,color])=><polyline key={name} points={data.map((v,i)=>`${x(i,data.length)},${y(v)}`).join(' ')} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke"/>)}{[0,5,10,15].filter(year=>year*12<months.length).map(year=><text key={year} x={x(year*12,months.length)} y={height-8} textAnchor="middle">{year}. rok</text>)}</svg></div></article>
}
function compact(value:number){const abs=Math.abs(value);if(abs>=1e6)return `${num.format(value/1e6)} mil.`;if(abs>=1e3)return `${num.format(value/1e3)} tis.`;return num.format(value)}
