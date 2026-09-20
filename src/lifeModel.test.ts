import { describe, expect, it } from 'vitest'
import { calculateLife, lifeDefaults, normalizeLifeInputs } from './lifeModel'

const clone=()=>normalizeLifeInputs(JSON.parse(JSON.stringify(lifeDefaults)))

describe('samostatný životný model',()=>{
  it('predaj pripíše iba cenu po nákladoch a zvolenom splatení hypotéky',()=>{
    const input=clone()
    input.horizonYears=2
    input.prague={...input.prague,sell:true,saleYear:1,salePrice:300000,debt:100000,mortgagePayoffRate:.5,saleCostRate:.03,monthlyPayment:0}
    input.beroun={...input.beroun,value:0,debt:0,monthlyPayment:0,monthlyOperating:0,rentAfterMove:false}
    input.salaryCz=0;input.salarySk=0;input.annualBonusBeforeMove=0;input.livingCz=0;input.livingSk=0;input.housingCz=0;input.housingSk=0
    const result=calculateLife(input)
    expect(result.transactions[0].cashChange).toBe(241000)
    expect(result.years[1].debt).toBeGreaterThan(50000)
    expect(result.warnings.some(w=>w.includes('zostáva dlh'))).toBe(true)
  })

  it('kúpu bývania rozdelí medzi hotovosť a automaticky dopočítaný úver',()=>{
    const input=clone()
    input.horizonYears=2
    input.slovakHome={...input.slovakHome,buy:true,year:1,price:200000,purchaseCosts:10000,cashContribution:50000,annualRate:.04,loanYears:20}
    const result=calculateLife(input)
    const purchase=result.transactions.find(t=>t.label.includes('Kúpa bývania'))!
    expect(purchase.cashChange).toBe(-50000)
    expect(purchase.detail).toContain('160000 EUR úver')
    expect(result.years[1].debt).toBeGreaterThan(input.prague.debt+input.beroun.debt)
  })

  it('po ukončení práce počíta potrebu hotovosti bez investičného výnosu',()=>{
    const input=clone()
    input.horizonYears=10
    input.stopWork=true;input.stopWorkYear=2
    input.moveYear=1;input.salarySk=3000;input.otherPassiveIncome=0
    input.prague={...input.prague,value:0,debt:0,monthlyPayment:0,monthlyOperating:0,rentAfterMove:false}
    input.beroun={...input.beroun,value:0,debt:0,monthlyPayment:0,monthlyOperating:0,rentAfterMove:false}
    input.livingSk=1000;input.housingSk=500
    const result=calculateLife(input)
    expect(result.retirementGapMonthly).toBe(1500)
    expect(result.cashNeededAfterRetirement).toBeCloseTo(1500*12*9)
  })

  it('nemení hotovosť výnosom',()=>{
    const input=clone()
    input.horizonYears=3
    input.stopWork=true;input.stopWorkYear=0;input.moveYear=0
    input.prague={...input.prague,value:0,debt:0,monthlyPayment:0,monthlyOperating:0,rentAfterMove:false}
    input.beroun={...input.beroun,value:0,debt:0,monthlyPayment:0,monthlyOperating:0,rentAfterMove:false}
    input.livingSk=0;input.housingSk=0;input.initialCash=100000
    const result=calculateLife(input)
    expect(result.years.at(-1)?.cash).toBe(100000)
  })
})
