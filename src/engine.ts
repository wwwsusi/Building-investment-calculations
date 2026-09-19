import { defaults, variants } from './data'
import type { Inputs, Month, Result, Transaction, VariantId } from './types'

const annuity=(p:number,annual:number,n:number)=>{ if(p<=0)return 0; const r=annual/12; return r===0?p/n:p*r/(1-Math.pow(1+r,-n)) }
const pay=(balance:number,annual:number,payment:number)=>{if(balance<=0)return [0,0] as const; const interest=balance*annual/12; const principal=Math.max(0,Math.min(balance,payment-interest)); return [Math.max(0,balance-principal),Math.min(payment,balance+interest)] as const}
export const saleNet=(value:number,debt:number,cost:number)=>value*(1-cost)-debt
export const initialNetWorth=(i:Inputs)=>i.cash+i.portfolio+i.dps+i.pragueValue+i.berounValue-i.pragueDebt-i.berounDebt-i.personalDebt

type Setup={ownP:boolean;ownB:boolean;buyBuilding:boolean;payP:number;payB:number;house:boolean;buildingDebtMode:boolean;familyApartment:boolean}
const setups:Record<VariantId,Setup>={
  1:{ownP:true,ownB:false,buyBuilding:false,payP:1,payB:1,house:false,buildingDebtMode:false,familyApartment:false},
  2:{ownP:true,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  3:{ownP:true,ownB:true,buyBuilding:true,payP:0,payB:0,house:false,buildingDebtMode:true,familyApartment:false},
  4:{ownP:true,ownB:false,buyBuilding:false,payP:0,payB:1,house:true,buildingDebtMode:false,familyApartment:false},
  5:{ownP:false,ownB:true,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  6:{ownP:true,ownB:false,buyBuilding:true,payP:Math.max(0,1-1750000/defaults.pragueDebt),payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  7:{ownP:false,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:false,familyApartment:false},
  8:{ownP:true,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:true}
}
export function runVariant(i:Inputs,id:VariantId,stress=0):Result{
  const s=setups[id], tx:Transaction[]=[]; let cash=i.cash, portfolio=i.portfolio, dps=i.dps;
  let pVal=i.pragueValue,bVal=i.berounValue,pDebt=i.pragueDebt,bDebt=i.berounDebt,personal=i.personalDebt;
  const raise=(amount:number,label:string)=>{let left=amount; const fromCash=Math.min(cash,left);cash-=fromCash;left-=fromCash; const fromPort=Math.min(portfolio,left);portfolio-=fromPort;left-=fromPort; if(i.dpsAvailable){const fromDps=Math.min(dps,left);dps-=fromDps;left-=fromDps} tx.push({label,source:0,use:amount-left});return left}
  if(!s.ownP){const proceeds=saleNet(pVal,pDebt,i.saleCost);cash+=Math.max(0,proceeds);tx.push({label:'Predaj Prahy',source:pVal*(1-i.saleCost),use:pDebt});pVal=0;pDebt=0}
  if(!s.ownB){const proceeds=saleNet(bVal,bDebt,i.saleCost);cash+=Math.max(0,proceeds);tx.push({label:'Predaj Berouna',source:bVal*(1-i.saleCost),use:bDebt});bVal=0;bDebt=0}
  let gap=raise(personal,'Splatenie osobného úveru'); if(gap===0)personal=0
  if(s.ownP&&s.payP>0){const target=id===6?1750000:0;const amt=Math.max(0,pDebt-target);gap+=raise(amt,'Splatenie hypotéky Praha');pDebt=Math.max(target,gap?target+gap:target)}
  if(s.ownB&&s.payB>0){const amt=bDebt;const miss=raise(amt,'Splatenie hypotéky Beroun');gap+=miss;bDebt=miss}
  let familyApartment=0
  if(s.familyApartment){familyApartment=i.familyApartmentValueEur*i.fx;tx.push({label:'Rodinný byt – nepeňažné aktívum',source:familyApartment,use:0});gap+=raise(i.sisterPayoutEur*i.fx,'Vyplatenie sestry z vlastných peňazí')}
  let building=0,buildingDebt=0;
  if(s.buyBuilding){building=i.buildingPriceEur*i.fx*i.buildingShare;let equity=building;if(s.buildingDebtMode){const ltv=id===8?i.familyBuildingLtv:i.buildingLtv;buildingDebt=building*ltv;equity-=buildingDebt}const miss=raise(equity,'Vlastný vklad do podielu budovy');gap+=miss;if(miss>0)building=Math.max(0,building-miss)}
  if(cash>i.reserveTarget){portfolio+=cash-i.reserveTarget;cash=i.reserveTarget}
  const initialLiquid=cash+portfolio+(i.dpsAvailable?dps:0);const initialDebt=pDebt+bDebt+personal+buildingDebt;
  const months=Math.max(60,i.horizonYears*12), out:Month[]=[]; let house=0,houseDebt=0,insolvent=false,fireMonth=null as number|null;
  const bldPayment=annuity(buildingDebt,i.buildingRate,i.buildingYears*12);
  for(let m=0;m<=months;m++){
    const moved=m>=i.moveMonth,retired=m>=i.retirementMonth;const year=m/12;const inf=Math.pow(1+i.inflation,year);const rentGrow=Math.pow(1+i.rentGrowth,year);
    if(m>0){pVal*=Math.pow(1+i.propertyGrowth,1/12);bVal*=Math.pow(1+i.propertyGrowth,1/12);building*=Math.pow(1+.02,1/12);familyApartment*=Math.pow(1+i.propertyGrowth,1/12);if(house)house*=Math.pow(1+i.propertyGrowth,1/12)}
    if(s.house&&m===i.houseMonth){const price=i.housePriceEur*i.fx*Math.pow(1+i.propertyGrowth,m/12);houseDebt=price*i.houseLoanShare;const miss=raise(price-houseDebt,'Kúpa domu');gap+=miss;house=Math.max(0,price-miss)}
    let workIncome=retired?0:(moved?i.salarySkEur*i.fx:i.salaryCz+(m%12===11?i.annualBonus:0));
    if(stress&&m>=i.moveMonth&&m<i.moveMonth+12)workIncome*=1-stress;
    let passive=0,assetCosts=0,debtService=0;
    if(pVal&&moved){passive+=i.pragueRent*rentGrow;assetCosts+=i.pragueCosts*inf}
    if(bVal&&(moved||id===3)){passive+=i.berounRent*rentGrow;assetCosts+=i.berounCosts*inf}
    if(building){passive+=i.buildingRentEur*i.fx*i.buildingShare*rentGrow*(1-stress*.4);assetCosts+=passive*i.buildingCostRate}
    const pp=pay(pDebt,i.pragueRate,i.praguePayment);pDebt=pp[0];debtService+=pp[1]; const bp=pay(bDebt,i.berounRate,i.berounPayment);bDebt=bp[0];debtService+=bp[1];
    const per=pay(personal,i.personalRate,i.personalPayment);personal=per[0];debtService+=per[1]; const bup=pay(buildingDebt,i.buildingRate,bldPayment);buildingDebt=bup[0];debtService+=bup[1];
    const hp=pay(houseDebt,i.houseRate,annuity(houseDebt,i.houseRate,Math.max(1,i.houseYears*12-mathHouseAge(m,i.houseMonth))));houseDebt=hp[0];debtService+=hp[1];
    let housing=0;if(!moved&&!pVal&&!bVal)housing=i.interimCzRent+i.interimCzServices; if(moved&&!house)housing=i.skHousing;
    let expenses=i.spending*inf+assetCosts+housing; let free=workIncome+passive-expenses-debtService;
    if(m===i.moveMonth&&stress>0){portfolio*=1-stress}
    portfolio*=Math.pow(1+i.portfolioReturn,1/12);
    if(free>=0){const top=Math.min(free,Math.max(0,i.reserveTarget-cash));cash+=top;portfolio+=free-top}else{let need=-free;const c=Math.min(cash,need);cash-=c;need-=c;const p=Math.min(portfolio,need);portfolio-=p;need-=p;if(need>1){insolvent=true;free=-need}}
    const netWorth=cash+portfolio+dps+pVal+bVal+building+familyApartment+house-pDebt-bDebt-buildingDebt-houseDebt-personal;
    const firePortfolio=cash+portfolio;const fireNeedMonthly=i.fireComfort*inf+assetCosts+housing+debtService;const fireCapacityMonthly=passive+firePortfolio*i.swr/12;const coverage=fireNeedMonthly>0?fireCapacityMonthly/fireNeedMonthly:0;
    if(fireMonth===null&&coverage>=1&&!insolvent)fireMonth=m;
    out.push({month:m,cash,portfolio,dps,prague:pVal,beroun:bVal,building,familyApartment,house,pragueDebt:pDebt,berounDebt:bDebt,buildingDebt,houseDebt,personalDebt:personal,income:workIncome,passive,expenses,debtService,freeCash:free,netWorth,firePortfolio,insolvent})
  }
  const pre=out[Math.min(12,out.length-1)],post=out[Math.min(i.moveMonth+1,out.length-1)],final=out[out.length-1];
  const moveInflation=Math.pow(1+i.inflation,i.moveMonth/12);const nonPersonalCosts=Math.max(0,post.expenses-i.spending*moveInflation);const fireNeed=i.fireComfort*moveInflation+nonPersonalCosts+post.debtService;const fireCoverage=fireNeed>0?(post.passive+post.firePortfolio*i.swr/12)/fireNeed:0;
  const feasible=gap<1&&!out.some(x=>x.insolvent);const liquidity=Math.min(1,initialLiquid/3000000),debtScore=Math.max(0,1-initialDebt/10000000),resilience=feasible?1:0;
  return{id,title:variants[id].title,short:variants[id].short,feasible,deficit:gap,timeline:out,transactions:tx,initialLiquid,initialDebt,passiveAfterMove:post.passive,cfBeforeMove:pre.freeCash,cfAfterMove:post.freeCash,fireCoverage,fireMonth,score:Math.round((liquidity*.35+debtScore*.25+resilience*.4)*100),tags:variants[id].tags}
}
const mathHouseAge=(m:number,start:number)=>Math.max(0,m-start)
export const runAll=(i:Inputs,stress=0)=>[1,2,3,4,5,6,7,8].map(id=>runVariant(i,id as VariantId,stress))
export const point=(r:Result,years:number)=>r.timeline[Math.min(r.timeline.length-1,years*12)]
export const money=(v:number,currency:'CZK'|'EUR'='CZK',fx=24.35)=>new Intl.NumberFormat('sk-SK',{style:'currency',currency,maximumFractionDigits:0}).format(currency==='EUR'?v/fx:v)
export const pct=(v:number)=>new Intl.NumberFormat('sk-SK',{style:'percent',maximumFractionDigits:0}).format(v)
