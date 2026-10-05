import { Router } from "express";
import { querySchema } from "./schemas.js";
import { authenticate } from "../auth/middleware.js";
import { config } from "../../config.js";
import { ApiError } from "../../errors.js";
import { createWeatherService } from "./service.js";

export function weatherRouter(fetcher: typeof fetch = fetch) {
  const router = Router();
  const getWeather = createWeatherService(fetcher);
  router.get("/weather", authenticate, async (req, res) => {
    const { latitude, longitude, location } = querySchema.parse(req.query);
    if (config.WEATHER_ENABLED !== "true") throw new ApiError(503, "Dịch vụ thời tiết đang tắt");
    try {
      res.json({ location, ...(await getWeather(latitude, longitude)) });
    } catch {
      throw new ApiError(503, "Không lấy được dữ liệu thời tiết. Vui lòng thử lại.");
    }
  });
  return router;
}
