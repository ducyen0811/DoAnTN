import { config } from "../../config.js";

export const jwtKey = new TextEncoder().encode(config.JWT_SECRET);
export const jwtIssuer = "healthai-api";
export const jwtAudience = "healthai-ui";
