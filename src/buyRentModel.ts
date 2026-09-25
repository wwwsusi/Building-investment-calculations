export type BuyRentCapex={id:string;label:string;year:number;totalCost:number;share:number}
export type BuyRentPurchaseCosts={appraisal:number;legal:number;cadastre:number;bank:number;inspection:number;project:number;division:number;other:number}

export type BuyRentInputs={
  price:number
  ownFunds:number
  autoLoan:boolean
  loan:number
  annualRate:number
  loanYears:number
  annualExtraPayment:number
  extraPaymentMonth:number
  propertyGrowth:number
  rentMonthly:number
  rentGrowth:number
  insuranceAnnual:number
  propertyTaxAnnual:number
  useAreaTax:boolean
  areaM2:number
  taxPerM2:number
  repairFundMonthly:number
  adminMonthly:number
  otherOwnershipAnnual:number
  reserveMonthly:number
  reserveSpendRate:number
  commonUtilitiesMonthly:number
  waterSewerMonthly:number
  heatingMonthly:number
  otherCommonMonthly:number
  purchaseCosts:BuyRentPurchaseCosts
  includeOpportunityCost:boolean
  alternativeReturn:number
  horizonYears:number
  capex:BuyRentCapex[]
}

export type BuyRentMonth={
  month:number
  propertyValue:number
  loanBalance:number
  equity:number
  reserveBalance:number
  buyInvestment:number
  rentInvestment:number
  buyWealth:number
  rentWealth:number
  advantage:number
  monthlyRent:number
  regularPayment:number
  extraPayment:number
  interestPaid:number
  principalPaid:number
  cumulativeRent:number
  cumulativeInterest:number
  cumulativeOwnershipCosts:number
  cumulativeCapex:number
  cumulativeBuyCashOutflow:number
}

export type BuyRentResult={
  months:BuyRentMonth[]
  payoffMonth:number|null
  breakEvenMonth:number|null
  interestWithoutExtra:number
  interestWithExtra:number
  interestSaved:number
  financingBalance:number
  purchaseCostsTotal:number
}

export const buyRentDefaults:BuyRentInputs={
  price:270000,
  ownFunds:200000,
  autoLoan:true,
  loan:70000,
  annualRate:.065,
  loanYears:15,
  annualExtraPayment:10000,
  extraPaymentMonth:12,
  propertyGrowth:.025,
  rentMonthly:780,
  rentGrowth:0,
  insuranceAnnual:600,
  propertyTaxAnnual:600,
  useAreaTax:false,
  areaM2:0,
  taxPerM2:0,
  repairFundMonthly:225,
  adminMonthly:0,
  otherOwnershipAnnual:0,
  reserveMonthly:150,
  reserveSpendRate:0,
  commonUtilitiesMonthly:100,
  waterSewerMonthly:0,
  heatingMonthly:0,
  otherCommonMonthly:0,
  purchaseCosts:{appraisal:0,legal:0,cadastre:0,bank:0,inspection:0,project:0,division:0,other:4000},
  includeOpportunityCost:true,
  alternativeReturn:.05,
  horizonYears:15,
  capex:[]
}

const finite=(value:number,fallback=0)=>Number.isFinite(value)?value:fallback
const clamp=(value:number,min=0,max=Infinity)=>Math.min(max,Math.max(min,finite(value,min)))

export function normalizeBuyRentInputs(raw:unknown):BuyRentInputs{
  const value=raw&&typeof raw==='object'?raw as Partial<BuyRentInputs>:{}
  const costs={...buyRentDefaults.purchaseCosts,...(value.purchaseCosts||{})}
  const capex=Array.isArray(value.capex)?value.capex.map((item,index)=>({
    id:typeof item?.id==='string'?item.id:`capex-${index}`,
    label:typeof item?.label==='string'?item.label:`Investícia ${index+1}`,
    year:Math.round(clamp(Number(item?.year),1,60)),
    totalCost:clamp(Number(item?.totalCost)),
    share:clamp(Number(item?.share),0,1)
  })):[]
  const normalized={...buyRentDefaults,...value,purchaseCosts:Object.fromEntries(Object.entries(costs).map(([key,v])=>[key,clamp(Number(v))])) as BuyRentPurchaseCosts,capex}
  normalized.price=clamp(Number(normalized.price))
  normalized.ownFunds=clamp(Number(normalized.ownFunds))
  normalized.autoLoan=typeof value.autoLoan==='boolean'?value.autoLoan:buyRentDefaults.autoLoan
  normalized.loan=clamp(Number(normalized.loan))
  normalized.annualRate=clamp(Number(normalized.annualRate),0,1)
  normalized.loanYears=Math.round(clamp(Number(normalized.loanYears),1,50))
  normalized.annualExtraPayment=clamp(Number(normalized.annualExtraPayment))
  normalized.extraPaymentMonth=Math.round(clamp(Number(normalized.extraPaymentMonth),1,12))
  normalized.propertyGrowth=clamp(Number(normalized.propertyGrowth),0,1)
  normalized.rentMonthly=clamp(Number(normalized.rentMonthly))
  normalized.rentGrowth=clamp(Number(normalized.rentGrowth),0,1)
  normalized.insuranceAnnual=clamp(Number(normalized.insuranceAnnual))
  normalized.propertyTaxAnnual=clamp(Number(normalized.propertyTaxAnnual))
  normalized.useAreaTax=typeof value.useAreaTax==='boolean'?value.useAreaTax:buyRentDefaults.useAreaTax
  normalized.areaM2=clamp(Number(normalized.areaM2))
  normalized.taxPerM2=clamp(Number(normalized.taxPerM2))
  normalized.repairFundMonthly=clamp(Number(normalized.repairFundMonthly))
  normalized.adminMonthly=clamp(Number(normalized.adminMonthly))
  normalized.otherOwnershipAnnual=clamp(Number(normalized.otherOwnershipAnnual))
  normalized.reserveMonthly=clamp(Number(normalized.reserveMonthly))
  normalized.reserveSpendRate=clamp(Number(normalized.reserveSpendRate),0,1)
  normalized.commonUtilitiesMonthly=clamp(Number(normalized.commonUtilitiesMonthly))
  normalized.waterSewerMonthly=clamp(Number(normalized.waterSewerMonthly))
  normalized.heatingMonthly=clamp(Number(normalized.heatingMonthly))
  normalized.otherCommonMonthly=clamp(Number(normalized.otherCommonMonthly))
  normalized.includeOpportunityCost=typeof value.includeOpportunityCost==='boolean'?value.includeOpportunityCost:buyRentDefaults.includeOpportunityCost
  normalized.alternativeReturn=clamp(Number(normalized.alternativeReturn),0,1)
  normalized.horizonYears=Math.round(clamp(Number(normalized.horizonYears),1,60))
  if(normalized.autoLoan)normalized.loan=Math.max(0,normalized.price-normalized.ownFunds)
  return normalized
}

export const purchaseCostsTotal=(costs:BuyRentPurchaseCosts)=>Object.values(costs).reduce((sum,value)=>sum+Math.max(0,value),0)

export function annuityPayment(principal:number,annualRate:number,years:number){
  if(principal<=0||years<=0)return 0
  const months=years*12,rate=annualRate/12
  return rate===0?principal/months:principal*rate/(1-Math.pow(1+rate,-months))
}

function fullLoanSchedule(principal:number,annualRate:number,years:number,annualExtra:number,extraMonth:number){
  let balance=Math.max(0,principal),interest=0,month=0
  const payment=annuityPayment(balance,annualRate,years),monthlyRate=annualRate/12,maxMonths=Math.max(1,years*12+600)
  while(balance>.005&&month<maxMonths){
    month++
    const monthInterest=balance*monthlyRate
    const regular=Math.min(balance+monthInterest,payment)
    interest+=monthInterest
    balance=Math.max(0,balance+monthInterest-regular)
    if((month-1)%12+1===extraMonth&&balance>0)balance=Math.max(0,balance-Math.min(balance,annualExtra))
  }
  return {interest,payoffMonth:principal<=0?0:balance<=.005?month:null}
}

export function calculateBuyRent(raw:BuyRentInputs):BuyRentResult{
  const i=normalizeBuyRentInputs(raw),loan=i.loan,costsTotal=purchaseCostsTotal(i.purchaseCosts)
  const payment=annuityPayment(loan,i.annualRate,i.loanYears),monthlyLoanRate=i.annualRate/12
  const propertyMonthly=Math.pow(1+i.propertyGrowth,1/12),rentMonthlyGrowth=Math.pow(1+i.rentGrowth,1/12)
  const investmentMonthly=i.includeOpportunityCost?Math.pow(1+i.alternativeReturn,1/12)-1:0
  const taxAnnual=i.useAreaTax?i.areaM2*i.taxPerM2:i.propertyTaxAnnual
  const fixedOwnershipMonthly=i.insuranceAnnual/12+taxAnnual/12+i.repairFundMonthly+i.adminMonthly+i.otherOwnershipAnnual/12
  const commonOperatingMonthly=i.commonUtilitiesMonthly+i.waterSewerMonthly+i.heatingMonthly+i.otherCommonMonthly
  const financingBalance=i.ownFunds+loan-i.price
  let propertyValue=i.price,balance=loan,reserveBalance=0,buyInvestment=Math.max(0,financingBalance),rentInvestment=i.ownFunds+costsTotal
  let cumulativeRent=0,cumulativeInterest=0,cumulativeOwnershipCosts=costsTotal,cumulativeCapex=0,cumulativeBuyCashOutflow=i.ownFunds+costsTotal
  let payoffMonth:number|null=loan<=0?0:null
  let breakEvenMonth:number|null=null
  const initialEquity=propertyValue-balance,initialBuyWealth=initialEquity+buyInvestment
  const months:BuyRentMonth[]=[{month:0,propertyValue,loanBalance:balance,equity:initialEquity,reserveBalance,buyInvestment,rentInvestment,buyWealth:initialBuyWealth,rentWealth:rentInvestment,advantage:initialBuyWealth-rentInvestment,monthlyRent:i.rentMonthly,regularPayment:0,extraPayment:0,interestPaid:0,principalPaid:0,cumulativeRent,cumulativeInterest,cumulativeOwnershipCosts,cumulativeCapex,cumulativeBuyCashOutflow}]
  for(let month=1;month<=i.horizonYears*12;month++){
    propertyValue*=propertyMonthly
    const currentRent=i.rentMonthly*Math.pow(rentMonthlyGrowth,month-1)
    cumulativeRent+=currentRent
    buyInvestment*=1+investmentMonthly
    rentInvestment*=1+investmentMonthly
    let interestPaid=0,regularPayment=0,principalPaid=0,extraPayment=0
    if(balance>0){
      interestPaid=balance*monthlyLoanRate
      regularPayment=Math.min(balance+interestPaid,payment)
      principalPaid=Math.max(0,regularPayment-interestPaid)
      balance=Math.max(0,balance+interestPaid-regularPayment)
      if((month-1)%12+1===i.extraPaymentMonth&&balance>0){
        extraPayment=Math.min(balance,i.annualExtraPayment)
        balance-=extraPayment
        principalPaid+=extraPayment
      }
      if(balance<=.005){balance=0;if(payoffMonth===null)payoffMonth=month}
    }
    cumulativeInterest+=interestPaid
    const reserveSpent=i.reserveMonthly*i.reserveSpendRate
    reserveBalance+=i.reserveMonthly-reserveSpent
    const capex=i.capex.filter(item=>month===item.year*12).reduce((sum,item)=>sum+item.totalCost*item.share,0)
    cumulativeCapex+=capex
    cumulativeOwnershipCosts+=interestPaid+fixedOwnershipMonthly+reserveSpent+capex
    const buyOutflow=regularPayment+extraPayment+fixedOwnershipMonthly+i.reserveMonthly+capex+commonOperatingMonthly
    const rentOutflow=currentRent+commonOperatingMonthly
    cumulativeBuyCashOutflow+=buyOutflow
    const difference=rentOutflow-buyOutflow
    if(difference>=0)buyInvestment+=difference
    else rentInvestment+=-difference
    const equity=propertyValue-balance,buyWealth=equity+reserveBalance+buyInvestment,rentWealth=rentInvestment,advantage=buyWealth-rentWealth
    if(breakEvenMonth===null&&advantage>=0)breakEvenMonth=month
    months.push({month,propertyValue,loanBalance:balance,equity,reserveBalance,buyInvestment,rentInvestment,buyWealth,rentWealth,advantage,monthlyRent:currentRent,regularPayment,extraPayment,interestPaid,principalPaid,cumulativeRent,cumulativeInterest,cumulativeOwnershipCosts,cumulativeCapex,cumulativeBuyCashOutflow})
  }
  const withoutExtra=fullLoanSchedule(loan,i.annualRate,i.loanYears,0,i.extraPaymentMonth)
  const withExtra=fullLoanSchedule(loan,i.annualRate,i.loanYears,i.annualExtraPayment,i.extraPaymentMonth)
  return {months,payoffMonth,breakEvenMonth,interestWithoutExtra:withoutExtra.interest,interestWithExtra:withExtra.interest,interestSaved:Math.max(0,withoutExtra.interest-withExtra.interest),financingBalance,purchaseCostsTotal:costsTotal}
}

export const atYear=(result:BuyRentResult,year:number)=>result.months[Math.min(result.months.length-1,Math.max(0,Math.round(year*12)))]
