export type PurchaseInputs={price:number;ownFunds:number;loan:number;annualRate:number;years:number;purchaseCosts:number;renovation:number}
export type OperationsInputs={rents:number[];vacancyRate:number;insuranceAnnual:number;utilitiesMonthly:number;accountingMonthly:number;propertyTaxAnnual:number;repairReserveRate:number;otherMonthly:number;loanPayment:number;propertyValue:number;cashInvested:number}

export const monthlyAnnuity=(loan:number,annualRate:number,years:number)=>{
  if(loan<=0||years<=0)return 0
  const months=years*12,rate=annualRate/12
  return rate===0?loan/months:loan*rate/(1-Math.pow(1+rate,-months))
}

export function calculatePurchase(i:PurchaseInputs){
  const payment=monthlyAnnuity(i.loan,i.annualRate,i.years)
  const totalAcquisition=i.price+i.purchaseCosts+i.renovation
  const totalLoanPaid=payment*i.years*12
  const financingBalance=i.ownFunds+i.loan-totalAcquisition
  const paidMonths=Math.min(12,Math.max(0,i.years*12)),monthlyRate=i.annualRate/12
  const balanceAfterYear=i.loan<=0?0:monthlyRate===0?Math.max(0,i.loan-payment*paidMonths):Math.max(0,i.loan*Math.pow(1+monthlyRate,paidMonths)-payment*(Math.pow(1+monthlyRate,paidMonths)-1)/monthlyRate)
  const firstYearPrincipal=Math.max(0,i.loan-balanceAfterYear)
  return {payment,totalAcquisition,totalLoanPaid,totalInterest:Math.max(0,totalLoanPaid-i.loan),financingBalance,ltv:i.price>0?i.loan/i.price:0,firstYearPrincipal}
}

export function calculateOperations(i:OperationsInputs){
  const grossRent=i.rents.reduce((sum,r)=>sum+Math.max(0,r),0)
  const vacancyRate=Math.min(1,Math.max(0,i.vacancyRate)),repairReserveRate=Math.min(1,Math.max(0,i.repairReserveRate))
  const effectiveRent=grossRent*(1-vacancyRate)
  const repairReserve=effectiveRent*repairReserveRate
  const fixedOperating=i.insuranceAnnual/12+i.utilitiesMonthly+i.accountingMonthly+i.propertyTaxAnnual/12+i.otherMonthly
  const operatingCosts=fixedOperating+repairReserve
  const noi=effectiveRent-operatingCosts
  const cashFlow=noi-i.loanPayment
  const capRate=i.propertyValue>0?noi*12/i.propertyValue:0
  const cashRoi=i.cashInvested>0?cashFlow*12/i.cashInvested:0
  const dscr=i.loanPayment>0?noi/i.loanPayment:0
  const breakEvenDenominator=grossRent*(1-repairReserveRate)
  const breakEvenOccupancy=breakEvenDenominator>0?(fixedOperating+i.loanPayment)/breakEvenDenominator:fixedOperating+i.loanPayment>0?Infinity:0
  return {grossRent,effectiveRent,repairReserve,operatingCosts,noi,cashFlow,capRate,cashRoi,dscr,breakEvenOccupancy}
}
