import { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { cache } from "../lib/cache.js";
import { AppError } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middleware/auth.js";

const RegisterBody = Type.Object({
  email:   Type.String({ format: "email" }),
  password:Type.String({ minLength: 8, maxLength: 128 }),
  name:    Type.String({ minLength: 2, maxLength: 100 }),
  orgName: Type.String({ minLength: 2, maxLength: 100 }),
});

const LoginBody = Type.Object({
  email:   Type.String({ format: "email" }),
  password:Type.String(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {

  app.post("/register", { schema: { body: RegisterBody } }, async (req, reply) => {
    const { email, password, name, orgName } = req.body as any;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already in use", 409);

    const slug = `${orgName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 12);
    const org = await prisma.organization.create({
      data: { name: orgName, slug, users: { create: { email, passwordHash, name, role: "ADMIN" } } },
      include: { users: true },
    });
    const user = org.users[0];
    const accessToken  = app.jwt.sign({ sub: user.id, orgId: org.id, role: user.role });
    const refreshToken = crypto.randomUUID();
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 86400_000) },
    });
    return reply.code(201).send({ accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: org.id } });
  });

  app.post("/login", { schema: { body: LoginBody } }, async (req, reply) => {
    const { email, password } = req.body as any;
    const attempts = cache.get<number>(`login:${email}`) || 0;
    if (attempts >= 10) throw new AppError("Account temporarily locked. Try again later.", 429);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { org: { select: { id: true, name: true, slug: true, plan: true } } },
    });
    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      cache.set(`login:${email}`, attempts + 1, 900);
      throw new AppError("Invalid email or password", 401);
    }
    cache.del(`login:${email}`);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken  = app.jwt.sign({ sub: user.id, orgId: user.orgId, role: user.role });
    const refreshToken = crypto.randomUUID();
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 86400_000) },
    });
    return { accessToken, refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, org: user.org } };
  });

  app.post("/refresh", async (req) => {
    const { refreshToken } = req.body as any;
    if (!refreshToken) throw new AppError("Refresh token required", 400);
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError("Invalid or expired refresh token", 401);
    }
    const accessToken = app.jwt.sign({ sub: stored.user.id, orgId: stored.user.orgId, role: stored.user.role });
    return { accessToken };
  });

  app.post("/logout", { preHandler: [authMiddleware] }, async (req, reply) => {
    const { refreshToken } = req.body as any;
    if (refreshToken) await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return reply.code(204).send();
  });

  app.get("/me", { preHandler: [authMiddleware] }, async (req) => {
    const { sub } = req.user as any;
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, email: true, name: true, role: true, orgId: true, avatarUrl: true,
                org: { select: { id: true, name: true, slug: true, plan: true } } },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  });
};
