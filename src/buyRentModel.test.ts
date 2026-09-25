import { describe, expect, it } from 'vitest'
import { annuityPayment, atYear, buyRentDefaults, calculateBuyRent, normalizeBuyRentInputs } from './buyRentModel'

const clean={
 ...buyRentDefaults,
 price:100000,ownFunds:50000,loan:50000,autoLoan:false,annualRate:0,loanYears:10,
 annualExtraPayment:0,propertyGrowth:0,rentMonthly:0,rentGrowth:0,insuranceAnnual:0,
 propertyTaxAnnual:0,repairFundMonthly:0,adminMonthly:0,otherOwnershipAnnual:0,
 reserveMonthly:0,commonUtilitiesMonthly:0,includeOpportunityCost:false,alternativeReturn:0,
 purchaseCosts:{appraisal:0,legal:0,cadastre:0,bank:0,inspection:0,project:0,division:0,other:0},
 capex:[],horizonYears:15
}

describe('buy vs rent model',()=>{
 it('uses Lady Fitness defaults and calculates the loan from price minus own funds',()=>{
  const inputs=normalizeBuyRentInputs(buyRentDefaults)
  expect(inputs.loan).toBe(70000)
  expect(annuityPayment(inputs.loan,inputs.annualRate,inputs.loanYears)).toBeCloseTo(609.76,1)
 })

 it('treats repaid principal as equity rather than an economic cost',()=>{
  const result=calculateBuyRent(clean)
  const paidOff=atYear(result,10)
  expect(paidOff.loanBalance).toBeCloseTo(0,6)
  expect(paidOff.buyWealth).toBeCloseTo(paidOff.rentWealth,6)
  expect(paidOff.advantage).toBeCloseTo(0,6)
 })

 it('does not let a common utility cost change the comparison',()=>{
  const zero=atYear(calculateBuyRent(clean),10).advantage
  const utilities=atYear(calculateBuyRent({...clean,commonUtilitiesMonthly:100,waterSewerMonthly:75,heatingMonthly:125,otherCommonMonthly:50}),10).advantage
  expect(utilities).toBeCloseTo(zero,6)
 })

 it('keeps an unspent reserve as an asset and counts only the spent part as cost',()=>{
  const saved=atYear(calculateBuyRent({...clean,reserveMonthly:100,reserveSpendRate:0}),10)
  const spent=atYear(calculateBuyRent({...clean,reserveMonthly:100,reserveSpendRate:1}),10)
  expect(saved.advantage).toBeCloseTo(0,6)
  expect(saved.reserveBalance).toBe(12000)
  expect(spent.advantage).toBeCloseTo(-12000,6)
 })

 it('reduces payoff time and interest with annual extra payments',()=>{
  const base={...clean,annualRate:.065,loanYears:15}
  const regular=calculateBuyRent(base)
  const accelerated=calculateBuyRent({...base,annualExtraPayment:5000})
  expect(accelerated.payoffMonth!).toBeLessThan(regular.payoffMonth!)
  expect(accelerated.interestWithExtra).toBeLessThan(regular.interestWithExtra)
  expect(accelerated.interestSaved).toBeGreaterThan(0)
 })

 it('stops all debt service after payoff while retaining the property',()=>{
  const result=calculateBuyRent({...clean,annualRate:.065,loanYears:15,annualExtraPayment:10000})
  expect(result.payoffMonth).not.toBeNull()
  const payoff=result.months[result.payoffMonth!]
  const after=result.months[result.payoffMonth!+1]
  expect(payoff.loanBalance).toBe(0)
  expect(after.regularPayment).toBe(0)
  expect(after.extraPayment).toBe(0)
  expect(after.loanBalance).toBe(0)
  expect(after.equity).toBeCloseTo(after.propertyValue,6)
 })

 it('lets BUY invest its lower monthly outflow after the loan is paid',()=>{
  const result=calculateBuyRent({...clean,annualRate:0,loanYears:1,rentMonthly:1000,includeOpportunityCost:false})
  const payoff=result.payoffMonth!
  const atPayoff=result.months[payoff]
  const after=result.months[payoff+1]
  expect(after.regularPayment).toBe(0)
  expect(after.buyInvestment-atPayoff.buyInvestment).toBeCloseTo(1000,6)
 })

 it('applies only the ownership share of CAPEX in its selected year',()=>{
  const result=calculateBuyRent({...clean,capex:[{id:'roof',label:'Strecha',year:3,totalCost:20000,share:.4}]})
  expect(atYear(result,2).cumulativeCapex).toBe(0)
  expect(atYear(result,3).cumulativeCapex).toBe(8000)
 })

 it('keeps surplus financing as an asset instead of making it disappear',()=>{
  const result=calculateBuyRent({...clean,ownFunds:60000,loan:50000})
  expect(result.financingBalance).toBe(10000)
  expect(result.months[0].buyWealth).toBe(60000)
 })
})
