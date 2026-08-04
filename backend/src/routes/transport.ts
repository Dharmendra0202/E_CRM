import { prisma } from "../utils/prisma";
import { Router, Response } from "express";

import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/transport/routes
router.get("/routes", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const routes = await prisma.transportRoute.findMany({
      include: { stops: { orderBy: { sortOrder: "asc" } }, vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ status: "success", data: routes });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/transport/routes
router.post("/routes", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, startPoint, endPoint, distance, vehicleId, driverName, driverPhone, fee, stops } = req.body;
    if (!name || !startPoint || !endPoint) { res.status(400).json({ status: "error", message: "name, startPoint, endPoint required." }); return; }
    const route = await prisma.transportRoute.create({
      data: {
        name, startPoint, endPoint, distance: distance || null,
        vehicleId: vehicleId || null, driverName: driverName || null,
        driverPhone: driverPhone || null, fee: fee ? parseFloat(fee) : 0,
      },
    });
    if (stops?.length) {
      await prisma.transportStop.createMany({
        data: stops.map((s: any, i: number) => ({ routeId: route.id, name: s.name, pickupTime: s.pickupTime || null, dropTime: s.dropTime || null, sortOrder: i })),
      });
    }
    const full = await prisma.transportRoute.findUnique({ where: { id: route.id }, include: { stops: true, vehicle: true } });
    res.status(201).json({ status: "success", data: full });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/transport/routes/:id
router.delete("/routes/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.transportRoute.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Route deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/transport/vehicles
router.get("/vehicles", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({ include: { _count: { select: { routes: true } } }, orderBy: { createdAt: "desc" } });
    res.json({ status: "success", data: vehicles });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// POST /api/v1/transport/vehicles
router.post("/vehicles", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { number, type, capacity, driverName, driverPhone, insuranceExpiry } = req.body;
    if (!number) { res.status(400).json({ status: "error", message: "Vehicle number required." }); return; }
    const vehicle = await prisma.vehicle.create({
      data: { number, type: type || "BUS", capacity: capacity || 40, driverName, driverPhone, insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null },
    });
    res.status(201).json({ status: "success", data: vehicle });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// DELETE /api/v1/transport/vehicles/:id
router.delete("/vehicles/:id", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ status: "success", message: "Vehicle deleted." });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

// GET /api/v1/transport/stats
router.get("/stats", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalRoutes = await prisma.transportRoute.count({ where: { status: "ACTIVE" } });
    const totalVehicles = await prisma.vehicle.count({ where: { status: "ACTIVE" } });
    const totalStops = await prisma.transportStop.count();
    res.json({ status: "success", data: { totalRoutes, totalVehicles, totalStops } });
  } catch (err: any) { res.status(500).json({ status: "error", message: err.message }); }
});

export default router;
