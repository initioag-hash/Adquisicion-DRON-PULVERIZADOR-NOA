
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { SimulationState, CalculationResults, DroneModel } from './types';
import { INITIAL_STATE, DRONE_SPECS } from './constants';
import { getStrategicRecommendation } from './services/geminiService';

// --- Sub-components ---

// Use PropsWithChildren to ensure 'children' is correctly recognized by the TypeScript compiler
const InputGroup = ({ title, children }: React.PropsWithChildren<{ title: string }>) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b pb-2">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const NumberInput = ({ label, value, onChange, prefix = "", suffix = "" }: { label: string, value: number, onChange: (val: number) => void, prefix?: string, suffix?: string }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-slate-600 mb-1">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{prefix}</span>}
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2 ${prefix ? 'pl-8' : 'px-3'} ${suffix ? 'pr-12' : 'px-3'} text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`}
      />
      {suffix && <span className="absolute right-3 top-2.5 text-slate-400 text-sm">{suffix}</span>}
    </div>
  </div>
);

const KPICard = ({ label, value, color, icon }: { label: string, value: string, color: string, icon?: React.ReactNode }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${color} flex flex-col justify-center`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
    </div>
    <span className="text-2xl font-bold text-slate-800">{value}</span>
  </div>
);

// --- Main App ---

export default function App() {
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [recommendation, setRecommendation] = useState<string>("Calculando estrategia...");
  const [isLoadingRec, setIsLoadingRec] = useState(false);

  // Core Calculation Logic
  const results = useMemo((): CalculationResults => {
    const { marketPrices, inputCosts, efficiency, workPlan, investmentAmount, serviceFeeHa } = state;
    
    // 1. Ahorro por Manchoneo
    const ahorroManchoneo = workPlan.manchoneoHa * inputCosts.herbicidaHa * (efficiency.ahorroManchoneoPct / 100);
    
    // 2. Valor Capturado por Pisado (Asumimos Cobertura Total como base de fungicidas/pisado)
    const valorCapturadoPisado = workPlan.coberturaTotalHa * (efficiency.recuperoPisadoPct / 100) * efficiency.rindeEstimadoSoja * marketPrices.soja;
    
    // 3. Valor de Labor Propia (Ahorro de no contratar servicio externo)
    // Cast Object.values to number[] to resolve TypeScript operator '+' errors on unknown types
    const totalHa = (Object.values(workPlan) as number[]).reduce((a, b) => a + b, 0);
    const valorLaborPropia = totalHa * serviceFeeHa;
    
    // Beneficio Neto Anual (Simplificado: Beneficios - Costos operativos estimados 15%)
    const beneficioBruto = ahorroManchoneo + valorCapturadoPisado + valorLaborPropia;
    const costosOperativos = beneficioBruto * 0.15; // Estimado de combustible, mantenimiento, operador
    const beneficioNetoAnual = beneficioBruto - costosOperativos;
    
    const paybackYears = investmentAmount / (beneficioNetoAnual || 1);
    
    // Break Even Ha: Cuántas hectáreas rinden lo suficiente para cubrir la inversión
    const beneficioPorHa = beneficioNetoAnual / (totalHa || 1);
    const breakEvenHa = investmentAmount / (beneficioPorHa || 1);

    return {
      ahorroManchoneo,
      valorCapturadoPisado,
      valorLaborPropia,
      beneficioNetoAnual,
      paybackYears,
      breakEvenHa
    };
  }, [state]);

  // Handle updates for Gemini recommendations
  const updateRecommendation = useCallback(async () => {
    setIsLoadingRec(true);
    const rec = await getStrategicRecommendation(state, results);
    setRecommendation(rec);
    setIsLoadingRec(false);
  }, [state, results]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateRecommendation();
    }, 1500); // Debounce AI requests
    return () => clearTimeout(timer);
  }, [updateRecommendation]);

  const chartData = [
    { name: 'Ahorro Manchoneo', value: results.ahorroManchoneo },
    { name: 'No Pisado', value: results.valorCapturadoPisado },
    { name: 'Labor Propia', value: results.valorLaborPropia },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b'];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white py-6 px-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-green-500 p-2 rounded-lg">🚁</span>
            Estrategia Agrotecnológica NOA
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Simulador DJI Agras - Caso 8.000 Ha Tucumán</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-tight">Inversión Equipo</span>
            <span className="text-xl font-bold text-green-400">USD {state.investmentAmount.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 h-full">
          <div className="sticky top-32">
            <InputGroup title="1. Selección de Equipo">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 mb-1">Modelo de Dron</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-green-500 transition-all"
                  value={state.droneModel}
                  onChange={(e) => {
                    const model = e.target.value as DroneModel;
                    setState(prev => ({ 
                      ...prev, 
                      droneModel: model, 
                      investmentAmount: DRONE_SPECS[model].price 
                    }));
                  }}
                >
                  <option value={DroneModel.T20P}>DJI Agras T20P (20L)</option>
                  <option value={DroneModel.T50}>DJI Agras T50 (50L)</option>
                  <option value={DroneModel.T70}>DJI Agras T70 (70L)</option>
                </select>
              </div>
              <div className="col-span-2">
                <NumberInput 
                  label="Inversión Manual (USD)" 
                  value={state.investmentAmount} 
                  onChange={(val) => setState(prev => ({ ...prev, investmentAmount: val }))}
                  prefix="$"
                />
              </div>
            </InputGroup>

            <InputGroup title="2. Precios de Mercado">
              <NumberInput 
                label="Soja (USD/tn)" 
                value={state.marketPrices.soja} 
                onChange={(val) => setState(prev => ({ ...prev, marketPrices: { ...prev.marketPrices, soja: val } }))}
              />
              <NumberInput 
                label="Maíz (USD/tn)" 
                value={state.marketPrices.maiz} 
                onChange={(val) => setState(prev => ({ ...prev, marketPrices: { ...prev.marketPrices, maiz: val } }))}
              />
              <NumberInput 
                label="Azúcar (USD/bolsa)" 
                value={state.marketPrices.azucar} 
                onChange={(val) => setState(prev => ({ ...prev, marketPrices: { ...prev.marketPrices, azucar: val } }))}
              />
            </InputGroup>

            <InputGroup title="3. Eficiencia y Plan">
              <NumberInput 
                label="Ahorro Manchoneo" 
                value={state.efficiency.ahorroManchoneoPct} 
                suffix="%" 
                onChange={(val) => setState(prev => ({ ...prev, efficiency: { ...prev.efficiency, ahorroManchoneoPct: val } }))}
              />
              <NumberInput 
                label="Superficie Recuperada" 
                value={state.efficiency.recuperoPisadoPct} 
                suffix="%" 
                onChange={(val) => setState(prev => ({ ...prev, efficiency: { ...prev.efficiency, recuperoPisadoPct: val } }))}
              />
              <div className="col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Hectáreas de Labor</label>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="Total Ha" value={state.workPlan.coberturaTotalHa} onChange={(val) => setState(prev => ({ ...prev, workPlan: { ...prev.workPlan, coberturaTotalHa: val } }))} />
                  <NumberInput label="Manchoneo" value={state.workPlan.manchoneoHa} onChange={(val) => setState(prev => ({ ...prev, workPlan: { ...prev.workPlan, manchoneoHa: val } }))} />
                </div>
              </div>
            </InputGroup>
          </div>
        </div>

        {/* Right Column: Results & AI */}
        <div className="lg:col-span-8">
          
          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard 
              label="Beneficio Neto Anual" 
              value={`USD ${results.beneficioNetoAnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} 
              color="border-green-500"
              icon={<span className="text-xl">💰</span>}
            />
            <KPICard 
              label="Retorno Inversión" 
              value={`${results.paybackYears.toFixed(1)} años`} 
              color="border-blue-500"
              icon={<span className="text-xl">⏱️</span>}
            />
            <KPICard 
              label="Punto Equilibrio" 
              value={`${results.breakEvenHa.toLocaleString(undefined, { maximumFractionDigits: 0 })} Ha`} 
              color="border-amber-500"
              icon={<span className="text-xl">📈</span>}
            />
          </div>

          {/* Visual Analysis Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                Desglose de Beneficios
                <span className="text-xs font-normal text-slate-400">(Estimado Anual)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `USD ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {chartData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      <span className="text-slate-600 font-medium">{d.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold">USD {d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                Comparativa de Labor
                <span className="text-xs font-normal text-slate-400">(Ahorro USD)</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed italic text-center">
                El manchoneo es el principal driver de rentabilidad en el NOA debido al alto costo de herbicidas.
              </p>
            </div>
          </div>

          {/* AI Recommendation Panel */}
          <div className="bg-slate-900 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 opacity-5 blur-3xl rounded-full -mr-20 -mt-20"></div>
            
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Recomendación Estratégica AI</h3>
                <p className="text-slate-400 text-sm">Análisis en tiempo real por el Consultor NOA</p>
              </div>
            </div>

            <div className="relative min-h-[150px]">
              {isLoadingRec ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full"></div>
                  Procesando nuevos datos de mercado...
                </div>
              ) : (
                <div className="prose prose-invert prose-green max-w-none">
                  {recommendation.split('\n').map((line, i) => (
                    <p key={i} className="text-slate-300 mb-4 leading-relaxed text-lg">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">IA Decision Support</span>
              <button 
                onClick={updateRecommendation}
                className="text-sm font-bold text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
              >
                Refrescar Análisis
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-7xl mx-auto px-4 mt-12 text-center">
        <p className="text-slate-400 text-xs">
          * Este simulador es una herramienta de apoyo a la toma de decisiones. Los valores de ROI y Payback son estimaciones basadas en los inputs proporcionados y pueden variar según condiciones climáticas, logísticas y operativas reales en el campo.
        </p>
      </footer>
    </div>
  );
}
