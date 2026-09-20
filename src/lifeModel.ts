import { monthlyAnnuity } from './calculator'

export type ExistingHome = {
  label:string
  value:number
  debt:number
  annualRate:number
  monthlyPayment:number
  monthlyOperating:number
  rentAfterMove:boolean
  monthlyRent:number
  sell:boolean
  saleYear:number
  salePrice:number
  saleCostRate:number
  mortgagePayoffRate:number
}

export type NewHome = {
  buy:boolean
  year:number
  price:number
  purchaseCosts:number
  cashContribution:number
  annualRate:number
  loanYears:number
  monthlyOperating:number
}

export type FamilyHome = {
  acquire:boolean
  year:number
  value:number
  sisterPayout:number
  cashContribution:number
  annualRate:number
  loanYears:number
  liveThere:boolean
  monthlyOperating:number
}

export type LifeInputs = {
  fx:number
  horizonYears:number
  initialCash:number
  moveYear:number
  stopWork:boolean
  stopWorkYear:number
  salaryCz:number
  salarySk:number
  annualBonusBeforeMove:number
  extraMonthlyBeforeMove:number
  livingCz:number
  livingSk:number
  housingCz:number
  housingSk:number
  otherPassiveIncome:number
  prague:ExistingHome
  beroun:ExistingHome
  slovakHome:NewHome
  familyHome:FamilyHome
}

export type LifeTransaction = {year:number;label:string;cashChange:number;detail:string}

export type LifeYear = {
  year:number
  location:'Česko'|'Slovensko'
  working:boolean
  cash:number
  propertyValue:number
  debt:number
  netWorth:number
  salaryMonthly:number
  pragueRentMonthly:number
  berounRentMonthly:number
  otherIncomeMonthly:number
  incomeMonthly:number
  livingMonthly:number
  housingMonthly:number
  pragueCostMonthly:number
  berounCostMonthly:number
  propertyCostsMonthly:number
  praguePaymentMonthly:number
  berounPaymentMonthly:number
  homePaymentMonthly:number
  familyPaymentMonthly:number
  debtPaymentsMonthly:number
  expensesMonthly:number
  cashFlowMonthly:number
  annualBonus:number
  transactionCash:number
  netCashChange:number
}

export type LifeResult = {
  years:LifeYear[]
  transactions:LifeTransaction[]
  firstNegativeYear:number|null
  cashAtMove:number
  cashAtRetirement:number
  cashNeededAfterRetirement:number
  retirementGapMonthly:number
  runwayYears:number|null
  warnings:string[]
}

const fx=24.35
export const lifeDefaults:LifeInputs={
  fx,
  horizonYears:30,
  initialCash:(926000+1120000)/fx,
  moveYear:5,
  stopWork:true,
  stopWorkYear:15,
  salaryCz:100000/fx,
  salarySk:2000,
  annualBonusBeforeMove:200000/fx,
  extraMonthlyBeforeMove:0,
  livingCz:30000/fx,
  livingSk:30000/fx,
  housingCz:0,
  housingSk:300,
  otherPassiveIncome:0,
  prague:{label:'Praha',value:7000000/fx,debt:3120963/fx,annualRate:.0489,monthlyPayment:18748/fx,monthlyOperating:7000/fx,rentAfterMove:true,monthlyRent:23000/fx,sell:false,saleYear:5,salePrice:7000000/fx,saleCostRate:.03,mortgagePayoffRate:1},
  beroun:{label:'Beroun',value:12000000/fx,debt:5870199/fx,annualRate:.0439,monthlyPayment:32263/fx,monthlyOperating:10000/fx,rentAfterMove:true,monthlyRent:25000/fx,sell:false,saleYear:5,salePrice:12000000/fx,saleCostRate:.03,mortgagePayoffRate:1},
  slovakHome:{buy:false,year:7,price:300000,purchaseCosts:0,cashContribution:60000,annualRate:.05,loanYears:20,monthlyOperating:300},
  familyHome:{acquire:false,year:5,value:120000,sisterPayout:60000,cashContribution:60000,annualRate:.05,loanYears:20,liveThere:false,monthlyOperating:300}
}

const clamp=(value:number,min=0,max=Infinity)=>Math.min(max,Math.max(min,Number.isFinite(value)?value:min))

export function normalizeLifeInputs(raw:unknown):LifeInputs{
  const source=raw&&typeof raw==='object'?raw as Partial<LifeInputs>:{}
  const property=(value:unknown,fallback:ExistingHome):ExistingHome=>{
    const v=value&&typeof value==='object'?value as Partial<ExistingHome>:{}
    return {...fallback,...v,label:typeof v.label==='string'?v.label:fallback.label,sell:typeof v.sell==='boolean'?v.sell:fallback.sell,rentAfterMove:typeof v.rentAfterMove==='boolean'?v.rentAfterMove:fallback.rentAfterMove,saleYear:Math.round(clamp(Number(v.saleYear??fallback.saleYear),1,60)),mortgagePayoffRate:clamp(Number(v.mortgagePayoffRate??fallback.mortgagePayoffRate),0,1),saleCostRate:clamp(Number(v.saleCostRate??fallback.saleCostRate),0,1)}
  }
  const slovak={...lifeDefaults.slovakHome,...(source.slovakHome||{})}
  const family={...lifeDefaults.familyHome,...(source.familyHome||{})}
  return {
    ...lifeDefaults,...source,
    fx:clamp(Number(source.fx??lifeDefaults.fx),.01),
    horizonYears:Math.round(clamp(Number(source.horizonYears??lifeDefaults.horizonYears),1,60)),
    moveYear:Math.round(clamp(Number(source.moveYear??lifeDefaults.moveYear),0,60)),
    stopWork:typeof source.stopWork==='boolean'?source.stopWork:lifeDefaults.stopWork,
    stopWorkYear:Math.round(clamp(Number(source.stopWorkYear??lifeDefaults.stopWorkYear),0,60)),
    prague:property(source.prague,lifeDefaults.prague),
    beroun:property(source.beroun,lifeDefaults.beroun),
    slovakHome:{...slovak,buy:Boolean(slovak.buy),year:Math.round(clamp(Number(slovak.year),1,60)),loanYears:Math.round(clamp(Number(slovak.loanYears),1,40))},
    familyHome:{...family,acquire:Boolean(family.acquire),liveThere:Boolean(family.liveThere),year:Math.round(clamp(Number(family.year),1,60)),loanYears:Math.round(clamp(Number(family.loanYears),1,40))}
  }
}

type LoanState={balance:number;rate:number;payment:number}
function payLoanYear(loan:LoanState){
  let balance=Math.max(0,loan.balance),paid=0
  const monthlyRate=Math.max(0,loan.rate)/12
  for(let month=0;month<12&&balance>0;month++){
    const due=balance*(1+monthlyRate)
    const payment=Math.min(due,Math.max(0,loan.payment))
    balance=Math.max(0,due-payment)
    paid+=payment
  }
  return {balance,paid}
}

function phaseYear(result:LifeYear[],requested:number){
  return result[Math.min(result.length-1,Math.max(0,requested))]
}

export function calculateLife(input:LifeInputs):LifeResult{
  const i=normalizeLifeInputs(input)
  const transactions:LifeTransaction[]=[],warnings:string[]=[]
  let cash=i.initialCash
  let pragueHeld=true,berounHeld=true,homeHeld=false,familyHeld=false
  let pragueLoan:LoanState={balance:i.prague.debt,rate:i.prague.annualRate,payment:i.prague.monthlyPayment}
  let berounLoan:LoanState={balance:i.beroun.debt,rate:i.beroun.annualRate,payment:i.beroun.monthlyPayment}
  let homeLoan:LoanState={balance:0,rate:i.slovakHome.annualRate,payment:0}
  let familyLoan:LoanState={balance:0,rate:i.familyHome.annualRate,payment:0}
  const initialProperty=i.prague.value+i.beroun.value
  const years:LifeYear[]=[{year:0,location:i.moveYear===0?'Slovensko':'Česko',working:!i.stopWork||i.stopWorkYear>0,cash,propertyValue:initialProperty,debt:pragueLoan.balance+berounLoan.balance,netWorth:cash+initialProperty-pragueLoan.balance-berounLoan.balance,salaryMonthly:0,pragueRentMonthly:0,berounRentMonthly:0,otherIncomeMonthly:0,incomeMonthly:0,livingMonthly:0,housingMonthly:0,pragueCostMonthly:0,berounCostMonthly:0,propertyCostsMonthly:0,praguePaymentMonthly:0,berounPaymentMonthly:0,homePaymentMonthly:0,familyPaymentMonthly:0,debtPaymentsMonthly:0,expensesMonthly:0,cashFlowMonthly:0,annualBonus:0,transactionCash:0,netCashChange:0}]

  for(let year=1;year<=i.horizonYears;year++){
    let transactionCash=0
    const sell=(home:ExistingHome,held:boolean,loan:LoanState)=>{
      const cost=home.salePrice*home.saleCostRate
      const payoff=Math.min(loan.balance,loan.balance*home.mortgagePayoffRate)
      const cashChange=home.salePrice-cost-payoff
      transactionCash+=cashChange
      cash+=cashChange
      const original=loan.balance
      loan.balance=Math.max(0,loan.balance-payoff)
      loan.payment=original>0?loan.payment*(loan.balance/original):0
      transactions.push({year,label:`Predaj: ${home.label}`,cashChange,detail:`Cena ${home.salePrice.toFixed(0)} EUR − náklady ${cost.toFixed(0)} EUR − splatená hypotéka ${payoff.toFixed(0)} EUR`})
      if(loan.balance>1)warnings.push(`${home.label}: po predaji v ${year}. roku zostáva dlh ${loan.balance.toFixed(0)} EUR. Overte súhlas banky a ďalšie zabezpečenie.`)
      return false
    }
    if(pragueHeld&&i.prague.sell&&i.prague.saleYear===year)pragueHeld=sell(i.prague,pragueHeld,pragueLoan)
    if(berounHeld&&i.beroun.sell&&i.beroun.saleYear===year)berounHeld=sell(i.beroun,berounHeld,berounLoan)

    if(i.familyHome.acquire&&!familyHeld&&i.familyHome.year===year){
      const total=i.familyHome.sisterPayout
      const own=Math.min(total,Math.max(0,i.familyHome.cashContribution))
      const loan=Math.max(0,total-own)
      cash-=own;transactionCash-=own;familyHeld=true
      familyLoan={balance:loan,rate:i.familyHome.annualRate,payment:monthlyAnnuity(loan,i.familyHome.annualRate,i.familyHome.loanYears)}
      transactions.push({year,label:'Vyplatenie sestry',cashChange:-own,detail:`Vyplatenie ${total.toFixed(0)} EUR: ${own.toFixed(0)} EUR hotovosť + ${loan.toFixed(0)} EUR nový úver`})
    }
    if(i.slovakHome.buy&&!homeHeld&&i.slovakHome.year===year){
      const total=i.slovakHome.price+i.slovakHome.purchaseCosts
      const own=Math.min(total,Math.max(0,i.slovakHome.cashContribution))
      const loan=Math.max(0,total-own)
      cash-=own;transactionCash-=own;homeHeld=true
      homeLoan={balance:loan,rate:i.slovakHome.annualRate,payment:monthlyAnnuity(loan,i.slovakHome.annualRate,i.slovakHome.loanYears)}
      transactions.push({year,label:'Kúpa bývania na Slovensku',cashChange:-own,detail:`Cena a náklady ${total.toFixed(0)} EUR: ${own.toFixed(0)} EUR hotovosť + ${loan.toFixed(0)} EUR úver`})
    }

    const onSk=year>=i.moveYear
    const working=!i.stopWork||year<i.stopWorkYear
    const salaryMonthly=working?(onSk?i.salarySk:i.salaryCz):0
    const pragueRentMonthly=pragueHeld&&i.prague.rentAfterMove&&onSk?i.prague.monthlyRent:0
    const berounRentMonthly=berounHeld&&i.beroun.rentAfterMove&&onSk?i.beroun.monthlyRent:0
    const otherIncomeMonthly=i.otherPassiveIncome+(working&&!onSk?i.extraMonthlyBeforeMove:0)
    const incomeMonthly=salaryMonthly+pragueRentMonthly+berounRentMonthly+otherIncomeMonthly
    const livingMonthly=onSk?i.livingSk:i.livingCz
    const housingMonthly=onSk?(familyHeld&&i.familyHome.liveThere?i.familyHome.monthlyOperating:homeHeld?i.slovakHome.monthlyOperating:i.housingSk):i.housingCz
    const pragueCostMonthly=pragueHeld?i.prague.monthlyOperating:0,berounCostMonthly=berounHeld?i.beroun.monthlyOperating:0
    const propertyCostsMonthly=pragueCostMonthly+berounCostMonthly

    const pLoan=payLoanYear(pragueLoan),bLoan=payLoanYear(berounLoan),hLoan=payLoanYear(homeLoan),fLoan=payLoanYear(familyLoan)
    pragueLoan.balance=pLoan.balance;berounLoan.balance=bLoan.balance;homeLoan.balance=hLoan.balance;familyLoan.balance=fLoan.balance
    const praguePaymentMonthly=pLoan.paid/12,berounPaymentMonthly=bLoan.paid/12,homePaymentMonthly=hLoan.paid/12,familyPaymentMonthly=fLoan.paid/12
    const debtPaymentsAnnual=pLoan.paid+bLoan.paid+hLoan.paid+fLoan.paid
    const debtPaymentsMonthly=debtPaymentsAnnual/12
    const expensesMonthly=livingMonthly+housingMonthly+propertyCostsMonthly+debtPaymentsMonthly
    const cashFlowMonthly=incomeMonthly-expensesMonthly
    const annualBonus=working&&!onSk?i.annualBonusBeforeMove:0
    const annualOperatingCash=cashFlowMonthly*12+annualBonus
    cash+=annualOperatingCash
    const propertyValue=(pragueHeld?i.prague.value:0)+(berounHeld?i.beroun.value:0)+(homeHeld?i.slovakHome.price:0)+(familyHeld?i.familyHome.value:0)
    const debt=pragueLoan.balance+berounLoan.balance+homeLoan.balance+familyLoan.balance
    years.push({year,location:onSk?'Slovensko':'Česko',working,cash,propertyValue,debt,netWorth:cash+propertyValue-debt,salaryMonthly,pragueRentMonthly,berounRentMonthly,otherIncomeMonthly,incomeMonthly,livingMonthly,housingMonthly,pragueCostMonthly,berounCostMonthly,propertyCostsMonthly,praguePaymentMonthly,berounPaymentMonthly,homePaymentMonthly,familyPaymentMonthly,debtPaymentsMonthly,expensesMonthly,cashFlowMonthly,annualBonus,transactionCash,netCashChange:transactionCash+annualOperatingCash})
  }

  const firstNegativeYear=years.find(row=>row.cash<0)?.year??null
  if(firstNegativeYear!==null)warnings.unshift(`Hotovosť klesne pod nulu v ${firstNegativeYear}. roku. Scenár potrebuje viac zdrojov, nižšie výdavky alebo odklad transakcie.`)
  const move=phaseYear(years,i.moveYear)
  const retirementIndex=i.stopWork?Math.min(i.horizonYears,Math.max(0,i.stopWorkYear)):i.horizonYears
  const beforeRetirement=phaseYear(years,Math.max(0,retirementIndex-1))
  const retirement=phaseYear(years,retirementIndex)
  let cumulative=0,minCumulative=0
  if(i.stopWork)for(const row of years.filter(row=>row.year>=retirementIndex)){cumulative+=row.netCashChange;minCumulative=Math.min(minCumulative,cumulative)}
  const cashNeededAfterRetirement=i.stopWork?Math.max(0,-minCumulative):0
  const retirementGapMonthly=i.stopWork?Math.max(0,-retirement.cashFlowMonthly):0
  const runwayYears=i.stopWork&&retirementGapMonthly>0?Math.max(0,beforeRetirement.cash)/(retirementGapMonthly*12):null
  return {years,transactions,firstNegativeYear,cashAtMove:move.cash,cashAtRetirement:beforeRetirement.cash,cashNeededAfterRetirement,retirementGapMonthly,runwayYears,warnings:[...new Set(warnings)]}
}
