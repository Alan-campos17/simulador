import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertScenarioSchema, processParametersSchema } from "@shared/schema";
import { z } from "zod";

// Calculate sustainability metrics from process parameters
function calculateSustainabilityMetrics(params: {
  energyConsumption: number;
  wasteGeneration: number;
  waterUsage: number;
  rawMaterials: number;
  productionVolume: number;
}) {
  const { energyConsumption, wasteGeneration, waterUsage, rawMaterials, productionVolume } = params;
  
  // Carbon footprint calculation (tCO₂/month)
  // Energy: 0.0005 tCO₂/kWh, Waste: 0.001 tCO₂/kg
  const carbonFootprint = (energyConsumption * 0.0005 + wasteGeneration * 0.001);
  
  // Water efficiency (0-100%)
  // Based on water usage per unit of production
  const waterUsagePerUnit = waterUsage / productionVolume;
  const baselineWaterUsage = 2.5; // liters per unit (baseline)
  const waterEfficiency = Math.max(0, Math.min(100, 100 - ((waterUsagePerUnit - baselineWaterUsage) / baselineWaterUsage * 100)));
  
  // Energy efficiency (0-100%)
  // Based on energy consumption per unit of production
  const energyPerUnit = energyConsumption / productionVolume;
  const baselineEnergy = 0.5; // kWh per unit (baseline)
  const energyEfficiency = Math.max(0, Math.min(100, 100 - ((energyPerUnit - baselineEnergy) / baselineEnergy * 100)));
  
  // Overall sustainability score
  const sustainabilityScore = (waterEfficiency + energyEfficiency) / 2;

  return {
    carbonFootprint: Math.round(carbonFootprint * 10) / 10,
    waterEfficiency: Math.round(waterEfficiency),
    energyEfficiency: Math.round(energyEfficiency),
    sustainabilityScore: Math.round(sustainabilityScore),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all scenarios
  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scenarios" });
    }
  });

  // Get scenario by ID
  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      const scenario = await storage.getScenario(id);
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scenario" });
    }
  });

  // Calculate metrics from process parameters
  app.post("/api/calculate-metrics", async (req, res) => {
    try {
      const params = processParametersSchema.parse(req.body);
      const metrics = calculateSustainabilityMetrics(params);
      res.json(metrics);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parameters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // Create new scenario
  app.post("/api/scenarios", async (req, res) => {
    try {
      const scenarioData = insertScenarioSchema.parse(req.body);
      
      // Calculate metrics for the scenario
      const metrics = calculateSustainabilityMetrics(scenarioData);
      
      const scenario = await storage.createScenario({
        ...scenarioData,
        ...metrics,
      });
      
      res.json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });

  // Delete scenario
  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid scenario ID" });
      }
      
      const deleted = await storage.deleteScenario(id);
      if (!deleted) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json({ message: "Scenario deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
