import "./config/env.js";
import express from "express";
import { applySecurity } from "./config/security.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import indexRouter from "./routes/index.js";
import scrapeRouter from "./routes/scrape.route.js";

const app = express();
applySecurity(app);
app.use(express.json());

app.use("/", indexRouter);
app.use("/scrape", scrapeRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Scraper API running at http://localhost:${PORT}`);
});
