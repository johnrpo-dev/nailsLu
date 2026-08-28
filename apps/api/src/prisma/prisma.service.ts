import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente de Prisma para SQLite.
 *
 * Desde Prisma 7 la conexion no se declara en `schema.prisma`: el cliente
 * recibe un adaptador de controlador. La ruta se resuelve contra la raiz del
 * paquete para que funcione igual al arrancar con `nest start` que compilado
 * desde `dist`.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
