import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // マイグレーションは Supabase の direct 接続（DIRECT_URL）を使う。
    url: env("DIRECT_URL"),
  },
});
