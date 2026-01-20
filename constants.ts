
import { DroneModel, SimulationState } from './types';

export const DRONE_SPECS = {
  [DroneModel.T20P]: { price: 25000, capacity: '20L' },
  [DroneModel.T50]: { price: 32000, capacity: '40L/50kg' },
  [DroneModel.T70]: { price: 45000, capacity: '70L' },
};

export const INITIAL_STATE: SimulationState = {
  droneModel: DroneModel.T50,
  investmentAmount: 32000,
  marketPrices: {
    soja: 320,
    maiz: 160,
    azucar: 15, // USD/bolsa
  },
  inputCosts: {
    herbicidaHa: 45,
    nutrizurLitre: 12,
  },
  efficiency: {
    ahorroManchoneoPct: 60,
    recuperoPisadoPct: 3,
    rindeEstimadoSoja: 3.2, // Tn/Ha
  },
  workPlan: {
    coberturaTotalHa: 2000,
    manchoneoHa: 4000,
    fertilizacionHa: 1500,
    siembraHa: 500,
  },
  serviceFeeHa: 10, // USD/Ha
};
