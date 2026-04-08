import NodeCache from "node-cache";

// TTL in seconds, check period 120s
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: false });
