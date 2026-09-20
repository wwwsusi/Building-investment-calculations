import { variants } from './data'
import type { Inputs, Month, Result, Transaction, VariantId } from './types'

const annuity=(p:number,annual:number,n:number)=>{ if(p<=0)return 0; const r=annual/12; return r===0?p/n:p*r/(1-Math.pow(1+r,-n)) }
const pay=(balance:number,annual:number,payment:number)=>{if(balance<=0)return [0,0] as const; const interest=balance*annual/12; const paid=Math.min(payment,balance+interest); return [Math.max(0,balance+interest-paid),paid] as const}
export const saleNet=(value:number,debt:number,cost:number)=>value*(1-cost)-debt
export const initialNetWorth=(i:Inputs)=>i.cash+i.portfolio+i.dps+i.pragueValue+i.berounValue-i.pragueDebt-i.berounDebt-i.personalDebt

type Setup={ownP:boolean;ownB:boolean;buyBuilding:boolean;payP:number;payB:number;house:boolean;buildingDebtMode:boolean;familyApartment:boolean}
const setups:Record<VariantId,Setup>={
  1:{ownP:true,ownB:false,buyBuilding:false,payP:1,payB:1,house:false,buildingDebtMode:false,familyApartment:false},
  2:{ownP:true,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  3:{ownP:true,ownB:true,buyBuilding:true,payP:0,payB:0,house:false,buildingDebtMode:true,familyApartment:false},
  4:{ownP:true,ownB:false,buyBuilding:false,payP:0,payB:1,house:true,buildingDebtMode:false,familyApartment:false},
  5:{ownP:false,ownB:true,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  6:{ownP:true,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:false},
  7:{ownP:false,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:false,familyApartment:false},
  8:{ownP:true,ownB:false,buyBuilding:true,payP:1,payB:1,house:true,buildingDebtMode:true,familyApartment:true}
}
export function runVariant(i:Inputs,id:VariantId,stress=0):Result{
  const s=setups[id], tx:Transaction[]=[]; let cash=i.cash, portfolio=i.portfolio, dps=i.dps;
  let pVal=i.pragueValue,bVal=i.berounValue,pDebt=i.pragueDebt,bDebt=i.berounDebt,personal=i.personalDebt;
  let gap=0
  const available=()=>cash+portfolio+(i.dpsAvailable?dps:0)
  const raise=(amount:number,label:string)=>{let left=amount; const fromCash=Math.min(cash,left);cash-=fromCash;left-=fromCash; const fromPort=Math.min(portfolio,left);portfolio-=fromPort;left-=fromPort; if(i.dpsAvailable){const fromDps=Math.min(dps,left);dps-=fromDps;left-=fromDps} tx.push({label,source:0,use:amount-left});return left}
  const sell=(which:string,value:number,debt:number)=>{const netBeforeDebt=value*(1-i.saleCost),shortfall=Math.max(0,debt-netBeforeDebt);if(shortfall>available()){gap+=shortfall-available();return {sold:false,value,debt}}if(shortfall>0)raise(shortfall,`Dofinancovanie predaja ${which}`);else cash+=netBeforeDebt-debt;tx.push({label:`Predaj ${which}`,source:netBeforeDebt,use:debt});return {sold:true,value:0,debt:0}}
  if(!s.ownP){const sold=sell('Prahy',pVal,pDebt);pVal=sold.value;pDebt=sold.debt}
  if(!s.ownB){const sold=sell('Berouna',bVal,bDebt);bVal=sold.value;bDebt=sold.debt}
  const personalMiss=raise(personal,'Splatenie osobného úveru');gap+=personalMiss;personal=personalMiss
  if(s.ownP&&s.payP>0){const target=id===6?Math.min(pDebt,i.v6PragueDebtTarget):0;const amt=Math.max(0,pDebt-target);const miss=raise(amt,'Splatenie hypotéky Praha');gap+=miss;pDebt=target+miss}
  if(s.ownB&&s.payB>0){const amt=bDebt;const miss=raise(amt,'Splatenie hypotéky Beroun');gap+=miss;bDebt=miss}
  let familyApartment=0
  if(s.familyApartment){const payout=i.sisterPayoutEur*i.fx;if(available()>=payout){raise(payout,'Vyplatenie sestry z vlastných peňazí');familyApartment=i.familyApartmentValueEur*i.fx;tx.push({label:'Rodinný byt – nepeňažné aktívum',source:familyApartment,use:0})}else gap+=payout-available()}
  let building=0,buildingDebt=0;
  if(s.buyBuilding){const price=i.buildingPriceEur*i.fx*i.buildingShare;const ltv=s.buildingDebtMode?(id===8?i.familyBuildingLtv:i.buildingLtv):0;const proposedDebt=price*ltv;const equity=price-proposedDebt;if(available()>=equity){raise(equity,'Vlastný vklad do podielu budovy');building=price;buildingDebt=proposedDebt}else gap+=equity-available()}
  if(cash>i.reserveTarget){portfolio+=cash-i.reserveTarget;cash=i.reserveTarget}
  const initialLiquid=cash+portfolio+(i.dpsAvailable?dps:0);const initialDebt=pDebt+bDebt+personal+buildingDebt;
  const months=Math.max(60,i.horizonYears*12), out:Month[]=[]; let house=0,houseDebt=0,insolvent=false;
  const bldPayment=annuity(buildingDebt,i.buildingRate,i.buildingYears*12);
  const initialFirePortfolio=cash+portfolio+(i.dpsAvailable?dps:0)
  const emptyBreakdown={personalSpending:0,pragueOperating:0,berounOperating:0,buildingOperating:0,slovakiaHousing:0,czechHousing:0,pragueLoan:0,berounLoan:0,personalLoan:0,buildingLoan:0,houseLoan:0}
  out.push({month:0,cash,portfolio,dps,prague:pVal,beroun:bVal,building,familyApartment,house,pragueDebt:pDebt,berounDebt:bDebt,buildingDebt,houseDebt,personalDebt:personal,income:0,passive:0,expenses:0,debtService:0,breakdown:emptyBreakdown,freeCash:0,netWorth:cash+portfolio+dps+pVal+bVal+building+familyApartment-pDebt-bDebt-buildingDebt-personal,firePortfolio:initialFirePortfolio,insolvent:false})
  const coverageHistory=[0]
  for(let m=1;m<=months;m++){
    const moved=m>i.moveMonth,retired=m>i.retirementMonth;const year=m/12;const inf=Math.pow(1+i.inflation,year);const rentGrow=Math.pow(1+i.rentGrowth,year);const stressWindow=stress>0&&m>i.moveMonth&&m<=i.moveMonth+12;
    pVal*=Math.pow(1+i.propertyGrowth,1/12);bVal*=Math.pow(1+i.propertyGrowth,1/12);building*=Math.pow(1+i.buildingGrowth,1/12);familyApartment*=Math.pow(1+i.propertyGrowth,1/12);dps*=Math.pow(1+i.dpsReturn,1/12);if(house)house*=Math.pow(1+i.propertyGrowth,1/12)
    if(s.house&&m===i.houseMonth){const price=i.housePriceEur*i.fx*Math.pow(1+i.propertyGrowth,m/12);const proposedDebt=price*i.houseLoanShare;const equity=price-proposedDebt;if(available()>=equity){raise(equity,'Kúpa domu');house=price;houseDebt=proposedDebt}else gap+=equity-available()}
    let workIncome=retired?0:(moved?i.salarySkEur*i.fx:i.salaryCz+(m%12===11?i.annualBonus:0));
    if(stressWindow)workIncome*=1-stress;
    let passive=0;
    const pragueOperating=pVal&&moved?i.pragueCosts*inf:0,berounOperating=bVal&&(moved||id===3)?i.berounCosts*inf:0;
    if(pVal&&moved)passive+=i.pragueRent*rentGrow
    if(bVal&&(moved||id===3))passive+=i.berounRent*rentGrow
    let buildingOperating=0
    if(building){const buildingRent=i.buildingRentEur*i.fx*i.buildingShare*rentGrow*(stressWindow?1-stress*.4:1);passive+=buildingRent;buildingOperating=buildingRent*i.buildingCostRate}
    const pp=pay(pDebt,i.pragueRate,i.praguePayment);pDebt=pp[0]; const bp=pay(bDebt,i.berounRate,i.berounPayment);bDebt=bp[0];
    const per=pay(personal,i.personalRate,i.personalPayment);personal=per[0]; const bup=pay(buildingDebt,i.buildingRate,bldPayment);buildingDebt=bup[0];
    const hp=pay(houseDebt,i.houseRate,annuity(houseDebt,i.houseRate,Math.max(1,i.houseYears*12-mathHouseAge(m,i.houseMonth))));houseDebt=hp[0];
    const czechHousing=!moved&&!pVal&&!bVal?i.interimCzRent+i.interimCzServices:0,slovakiaHousing=moved&&!house?i.skHousingEur*i.fx:0,personalSpending=i.spending*inf;
    const breakdown={personalSpending,pragueOperating,berounOperating,buildingOperating,slovakiaHousing,czechHousing,pragueLoan:pp[1],berounLoan:bp[1],personalLoan:per[1],buildingLoan:bup[1],houseLoan:hp[1]}
    const expenses=personalSpending+pragueOperating+berounOperating+buildingOperating+slovakiaHousing+czechHousing,debtService=pp[1]+bp[1]+per[1]+bup[1]+hp[1]; let free=workIncome+passive-expenses-debtService;
    if(m===i.moveMonth+1&&stress>0){portfolio*=1-stress}
    portfolio*=Math.pow(1+i.portfolioReturn,1/12);
    if(free>=0){const top=Math.min(free,Math.max(0,i.reserveTarget-cash));cash+=top;portfolio+=free-top}else{let need=-free;const c=Math.min(cash,need);cash-=c;need-=c;const p=Math.min(portfolio,need);portfolio-=p;need-=p;if(need>1){insolvent=true;free=-need}}
    const netWorth=cash+portfolio+dps+pVal+bVal+building+familyApartment+house-pDebt-bDebt-buildingDebt-houseDebt-personal;
    const firePortfolio=cash+portfolio+(i.dpsAvailable?dps:0);const nonPersonalCosts=expenses-personalSpending;const fireNeedMonthly=i.fireComfort*inf+nonPersonalCosts+debtService;const fireCapacityMonthly=passive+firePortfolio*i.swr/12;const coverage=fireNeedMonthly>0?fireCapacityMonthly/fireNeedMonthly:0;coverageHistory.push(coverage)
    out.push({month:m,cash,portfolio,dps,prague:pVal,beroun:bVal,building,familyApartment,house,pragueDebt:pDebt,berounDebt:bDebt,buildingDebt,houseDebt,personalDebt:personal,income:workIncome,passive,expenses,debtService,breakdown,freeCash:free,netWorth,firePortfolio,insolvent})
  }
  let fireMonth=null as number|null,sustainable=true
  for(let m=out.length-1;m>=0;m--){sustainable=sustainable&&coverageHistory[m]>=1&&!out[m].insolvent;if(sustainable)fireMonth=m}
  const pre=out[Math.min(12,out.length-1)],post=out[Math.min(i.moveMonth+1,out.length-1)],final=out[out.length-1];
  const postInflation=Math.pow(1+i.inflation,post.month/12);const nonPersonalCosts=Math.max(0,post.expenses-i.spending*postInflation);const fireNeed=i.fireComfort*postInflation+nonPersonalCosts+post.debtService;const fireCoverage=fireNeed>0?(post.passive+post.firePortfolio*i.swr/12)/fireNeed:0;
  const feasible=gap<1&&!out.some(x=>x.insolvent);const liquidity=Math.min(1,initialLiquid/3000000),debtScore=Math.max(0,1-initialDebt/10000000),resilience=feasible?1:0;
  return{id,title:variants[id].title,short:variants[id].short,feasible,deficit:gap,timeline:out,transactions:tx,initialLiquid,initialDebt,passiveAfterMove:post.passive,cfBeforeMove:pre.freeCash,cfAfterMove:post.freeCash,fireCoverage,fireMonth,score:Math.round((liquidity*.35+debtScore*.25+resilience*.4)*100),tags:variants[id].tags}
}
const mathHouseAge=(m:number,start:number)=>Math.max(0,m-start)
export const runAll=(i:Inputs,stress=0)=>[1,2,3,4,5,6,7,8].map(id=>runVariant(i,id as VariantId,stress))
export const point=(r:Result,years:number)=>r.timeline[Math.min(r.timeline.length-1,years*12)]
export const money=(v:number,currency:'CZK'|'EUR'='CZK',fx=24.35)=>new Intl.NumberFormat('sk-SK',{style:'currency',currency,maximumFractionDigits:0}).format(currency==='EUR'?v/fx:v)
export const pct=(v:number)=>new Intl.NumberFormat('sk-SK',{style:'percent',maximumFractionDigits:0}).format(v)
