import { scenarios, type Scenario, type InsertScenario } from "@shared/schema";

export interface IStorage {
  getScenario(id: number): Promise<Scenario | undefined>;
  getAllScenarios(): Promise<Scenario[]>;
  createScenario(scenario: InsertScenario & {
    carbonFootprint: number;
    waterEfficiency: number;
    energyEfficiency: number;
    sustainabilityScore: number;
  }): Promise<Scenario>;
  deleteScenario(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private scenarios: Map<number, Scenario>;
  currentId: number;

  constructor() {
    this.scenarios = new Map();
    this.currentId = 1;
    
    // Add default scenarios
    this.initializeDefaultScenarios();
  }

  private initializeDefaultScenarios() {
    const defaultScenarios = [
      {
        name: "Cenário Atual",
        energyConsumption: 5000,
        wasteGeneration: 1200,
        waterUsage: 25000,
        rawMaterials: 8000,
        productionVolume: 10000,
        carbonFootprint: 2.8,
        waterEfficiency: 72,
        energyEfficiency: 85,
        sustainabilityScore: 76,
        createdAt: new Date(),
      },
      {
        name: "Cenário Otimizado",
        energyConsumption: 3500,
        wasteGeneration: 800,
        waterUsage: 18000,
        rawMaterials: 7500,
        productionVolume: 10000,
        carbonFootprint: 2.0,
        waterEfficiency: 85,
        energyEfficiency: 92,
        sustainabilityScore: 89,
        createdAt: new Date(),
      },
      {
        name: "Cenário Verde",
        energyConsumption: 2500,
        wasteGeneration: 600,
        waterUsage: 15000,
        rawMaterials: 7000,
        productionVolume: 10000,
        carbonFootprint: 1.4,
        waterEfficiency: 92,
        energyEfficiency: 96,
        sustainabilityScore: 94,
        createdAt: new Date(),
      },
    ];

    defaultScenarios.forEach(scenario => {
      const id = this.currentId++;
      const fullScenario: Scenario = { ...scenario, id };
      this.scenarios.set(id, fullScenario);
    });
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createScenario(insertScenario: InsertScenario & {
    carbonFootprint: number;
    waterEfficiency: number;
    energyEfficiency: number;
    sustainabilityScore: number;
  }): Promise<Scenario> {
    const id = this.currentId++;
    const scenario: Scenario = { 
      ...insertScenario, 
      id,
      createdAt: new Date(),
    };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async deleteScenario(id: number): Promise<boolean> {
    return this.scenarios.delete(id);
  }
}

export const storage = new MemStorage();
