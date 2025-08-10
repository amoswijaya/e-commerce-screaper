const LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };
const CUR = LEVELS[(process.env.LOG_LEVEL || "info").toLowerCase()] ?? 2;
const stamp = () => new Date().toISOString();
const log = (lvl, ...a) => {
  if (CUR >= LEVELS[lvl])
    console[lvl === "error" ? "error" : "log"](`[${stamp()}] [${lvl}]`, ...a);
};
export const logger = {
  error: (...a) => log("error", ...a),
  warn: (...a) => log("warn", ...a),
  info: (...a) => log("info", ...a),
  debug: (...a) => log("debug", ...a),
  trace: (...a) => log("trace", ...a),
  timer: (label) => {
    const t0 = process.hrtime.bigint();
    return () => {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      if (CUR >= LEVELS.debug)
        console.log(`[${stamp()}] [debug] ${label}: ${ms.toFixed(1)}ms`);
      return ms;
    };
  },
};
