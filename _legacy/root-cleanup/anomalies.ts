{
  "name": "terrawatch-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev":        "tsx watch src/server.ts",
    "build":      "tsc -p tsconfig.json",
    "start":      "node dist/server.js",
    "db:migrate": "prisma migrate deploy",
    "db:seed":    "tsx ../prisma/seed.ts",
    "db:studio":  "prisma studio --port 5555",
    "lint":       "eslint src --ext .ts"
  },
  "dependencies": {
    "@fastify/cors":                  "^9.0.1",
    "@fastify/helmet":                "^11.1.1",
    "@fastify/jwt":                   "^8.0.1",
    "@fastify/rate-limit":            "^9.1.0",
    "@fastify/type-provider-typebox": "^4.0.1",
    "@fastify/websocket":             "^10.0.1",
    "@prisma/client":                 "^5.10.2",
    "@sendgrid/mail":                 "^8.1.1",
    "@sinclair/typebox":              "^0.32.23",
    "bcryptjs":                       "^2.4.3",
    "fastify":                        "^4.26.2",
    "node-cache":                     "^5.1.2",
    "node-cron":                      "^3.0.3",
    "pino":                           "^8.19.0",
    "pino-pretty":                    "^10.3.1",
    "twilio":                         "^5.0.4",
    "zod":                            "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs":  "^2.4.6",
    "@types/node":      "^20.11.19",
    "@types/node-cron": "^3.0.11",
    "prisma":           "^5.10.2",
    "tsx":              "^4.7.1",
    "typescript":       "^5.3.3"
  }
}
