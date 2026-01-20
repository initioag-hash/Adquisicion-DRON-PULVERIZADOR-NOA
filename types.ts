
export enum DroneModel {
  T20P = 'T20P',
  T50 = 'T50',
  T70 = 'T70'
}

export interface MarketPrices {
  soja: number;
  maiz: number;
  azucar: number;
}

export interface InputCosts {
  herbicidaHa: number;
  nutrizurLitre: number;
}

export interface EfficiencyVariables {
  ahorroManchoneoPct: number;
  recuperoPisadoPct: number;
  rindeEstimadoSoja: number;
}

export interface WorkPlan {
  coberturaTotalHa: number;
  manchoneoHa: number;
  fertilizacionHa: number;
  siembraHa: number;
}

export interface SimulationState {
  droneModel: DroneModel;
  investmentAmount: number;
  marketPrices: MarketPrices;
  inputCosts: InputCosts;
  efficiency: EfficiencyVariables;
  workPlan: WorkPlan;
  serviceFeeHa: number;
}

export interface CalculationResults {
  ahorroManchoneo: number;
  valorCapturadoPisado: number;
  valorLaborPropia: number;
  beneficioNetoAnual: number;
  paybackYears: number;
  breakEvenHa: number;
}
