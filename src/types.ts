export type VariantId = 1|2|3|4|5|6|7|8
export type Inputs = {
  salaryCz:number; annualBonus:number; salarySkEur:number; spending:number; fx:number;
  moveMonth:number; horizonYears:number; inflation:number; portfolioReturn:number; dpsReturn:number; propertyGrowth:number; buildingGrowth:number; rentGrowth:number;
  swr:number; reserveTarget:number; saleCost:number; cash:number; portfolio:number; dps:number; dpsAvailable:boolean;
  pragueValue:number; pragueDebt:number; praguePayment:number; pragueRate:number; pragueRent:number; pragueCosts:number;
  berounValue:number; berounDebt:number; berounPayment:number; berounRate:number; berounRent:number; berounCosts:number;
  personalDebt:number; personalPayment:number; personalRate:number; buildingPriceEur:number; buildingShare:number; buildingLtv:number;
  v6PragueDebtTarget:number;
  familyApartmentValueEur:number; sisterPayoutEur:number; familyBuildingLtv:number;
  buildingRentEur:number; buildingCostRate:number; buildingRate:number; buildingYears:number; housePriceEur:number; houseMonth:number;
  houseLoanShare:number; houseRate:number; houseYears:number; interimCzRent:number; interimCzServices:number; skHousingEur:number;
  fireLean:number; fireComfort:number; fireTravel:number; retirementMonth:number;
}
export type CashFlowBreakdown = {
  personalSpending:number; pragueOperating:number; berounOperating:number; buildingOperating:number; slovakiaHousing:number; czechHousing:number;
  pragueLoan:number; berounLoan:number; personalLoan:number; buildingLoan:number; houseLoan:number;
}
export type Month = { month:number; cash:number; portfolio:number; dps:number; prague:number; beroun:number; building:number; familyApartment:number; house:number; pragueDebt:number; berounDebt:number; buildingDebt:number; houseDebt:number; personalDebt:number; income:number; passive:number; expenses:number; debtService:number; breakdown:CashFlowBreakdown; freeCash:number; netWorth:number; firePortfolio:number; insolvent:boolean }
export type Transaction = { label:string; source:number; use:number }
export type Result = { id:VariantId; title:string; short:string; feasible:boolean; deficit:number; timeline:Month[]; transactions:Transaction[]; initialLiquid:number; initialDebt:number; passiveAfterMove:number; cfBeforeMove:number; cfAfterMove:number; fireCoverage:number; fireMonth:number|null; score:number; tags:string[] }
