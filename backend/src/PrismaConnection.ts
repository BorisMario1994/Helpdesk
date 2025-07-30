import { PrismaClient } from "../generated/prisma";

// Create and export a Prisma Client instance to be used on all over the backend app.
// Instance should be initialize only once along a client's lifetime session to prevent
// overload on connection pool.
const prisma = new PrismaClient();

export default prisma;
