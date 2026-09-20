import {describe,expect,it} from 'vitest'
import {calculateOperations,calculatePurchase,monthlyAnnuity} from './calculator'

describe('realitná kalkulačka',()=>{
  it('počíta základnú anuitnú splátku',()=>expect(monthlyAnnuity(160000,.04,20)).toBeCloseTo(969.57,1))
  it('oddelí celkovú cenu, úrok a chýbajúce financovanie',()=>{const r=calculatePurchase({price:200000,ownFunds:40000,loan:160000,annualRate:.04,years:20,purchaseCosts:5000,renovation:10000});expect(r.totalAcquisition).toBe(215000);expect(r.financingBalance).toBe(-15000);expect(r.totalInterest).toBeGreaterThan(70000);expect(r.firstYearPrincipal).toBeGreaterThan(5000)})
  it('počíta NOI bez splátky a cash flow po splátke',()=>{const r=calculateOperations({rents:[1000,800],vacancyRate:.05,insuranceAnnual:1200,utilitiesMonthly:150,accountingMonthly:50,propertyTaxAnnual:600,repairReserveRate:.1,otherMonthly:0,loanPayment:700,propertyValue:200000,cashInvested:50000});expect(r.grossRent).toBe(1800);expect(r.noi).toBe(1189);expect(r.cashFlow).toBe(489)})
  it('ohraničí percentá a pri nulovej báze nepredstiera nulový bod zvratu',()=>{const r=calculateOperations({rents:[1000],vacancyRate:2,insuranceAnnual:1200,utilitiesMonthly:0,accountingMonthly:0,propertyTaxAnnual:0,repairReserveRate:2,otherMonthly:0,loanPayment:500,propertyValue:200000,cashInvested:50000});expect(r.effectiveRent).toBe(0);expect(r.repairReserve).toBe(0);expect(r.breakEvenOccupancy).toBe(Infinity)})
})
