
import { config } from "./config/app.config.js";

console.log("DEBUG_CONFIG_START");
console.log("PORT:", config.PORT);
console.log("GOOGLE_CALLBACK_URL:", config.GOOGLE_CALLBACK_URL);
console.log("FRONTEND_ORIGIN:", config.FRONTEND_ORIGIN);
console.log("DEBUG_CONFIG_END");
