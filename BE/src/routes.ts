import { Router } from "express";
import { authenticate } from "./modules/auth/middleware.js";
import { authRouter } from "./modules/auth/routes.js";
import { weatherRouter } from "./modules/weather/routes.js";
import { router as iotRouter } from "./modules/devices/iot.routes.js";
import { router as profileRouter } from "./modules/profile/routes.js";
import { router as weightsRouter } from "./modules/weights/routes.js";
import { router as dashboardRouter } from "./modules/dashboard/routes.js";
import { router as devicesRouter } from "./modules/devices/routes.js";
import { router as measurementsRouter } from "./modules/measurements/routes.js";
import { router as recommendationsRouter } from "./modules/recommendations/routes.js";
import { router as activityRouter } from "./modules/activity/routes.js";

export function createApiRouter(fetcher?: typeof fetch) {
  const router = Router();
  router.use(weatherRouter(fetcher));
  router.use("/auth", authRouter);
  router.use(iotRouter);

  router.use(authenticate);
  router.use(profileRouter);
  router.use(weightsRouter);
  router.use(dashboardRouter);
  router.use(devicesRouter);
  router.use(measurementsRouter);
  router.use(recommendationsRouter);
  router.use(activityRouter);
  return router;
}
