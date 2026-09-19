import { describe,expect,it } from 'vitest'
import { defaults } from './data'
import { initialNetWorth, runVariant, saleNet } from './engine'
describe('kontrolné výpočty',()=>{
  it('sedí východisková bilancia',()=>expect(initialNetWorth(defaults)).toBe(11768627))
  it('sedí čistý predaj',()=>{expect(saleNet(defaults.berounValue,defaults.berounDebt,.03)).toBe(5769801);expect(saleNet(defaults.pragueValue,defaults.pragueDebt,.03)).toBe(3669037)})
  it('V1 a V7 rešpektujú disponibilitu DPS',()=>{const v1=runVariant(defaults,1);const v7=runVariant(defaults,7);expect(Math.round(v1.initialLiquid)).toBe(3708627);expect(Math.round(v7.initialLiquid)).toBe(5628627)})
  it('presun mení mzdu a bonus je iba raz ročne',()=>{const r=runVariant(defaults,1);expect(r.timeline[58].income).toBe(100000);expect(r.timeline[59].income).toBe(300000);expect(r.timeline[60].income).toBe(defaults.salarySkEur*defaults.fx)})
  it('Praha sa prenajíma až po presune',()=>{const r=runVariant(defaults,3);expect(r.timeline[12].passive).toBeGreaterThan(0);expect(r.timeline[60].passive).toBeGreaterThan(r.timeline[59].passive)})
  it('Comfort FIRE pokrytie je konečný pomer',()=>{const coverage=runVariant(defaults,6).fireCoverage;expect(Number.isFinite(coverage)).toBe(true);expect(coverage).toBeGreaterThanOrEqual(0)})
  it('V8 vyplatí sestru z vlastných zdrojov a rodinný byt pridá ako aktívum',()=>{const r=runVariant(defaults,8);expect(Math.round(r.initialLiquid)).toBe(1273627);expect(Math.round(r.initialDebt)).toBe(3896000);expect(Math.round(r.timeline[0].familyApartment)).toBe(2922000);expect(r.timeline[0].personalDebt).toBe(0);expect(r.timeline[0].pragueDebt).toBe(0)})
  it('V2 oddeľuje cenu podielu budovy, nový úver a vlastný vklad',()=>{const r=runVariant(defaults,2);const share=defaults.buildingPriceEur*defaults.fx*defaults.buildingShare;expect(share).toBe(4870000);expect(r.initialDebt).toBe(2922000);expect(share-r.initialDebt).toBe(1948000)})
})
