import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  /**
   * Detras de un proxy inverso (Caddy, nginx) todas las peticiones llegan con
   * la IP del proxy. Sin esto el rate limiting contaria a todas las clientas
   * como una sola y las bloquearia juntas tras cinco reservas en el dia.
   *
   * Se activa solo cuando hay proxy declarado: confiar en la cabecera
   * `X-Forwarded-For` sin proxy delante permitiria falsear la IP y saltarse
   * el limite.
   */
  const proxies = config.get<string>("TRUST_PROXY");
  if (proxies) {
    app.set("trust proxy", /^\d+$/.test(proxies) ? Number(proxies) : proxies);
  }

  app.use(helmet());

  /**
   * En produccion `WEB_ORIGIN` debe listar los dominios del sitio. Si falta,
   * se acepta cualquier origen, que solo es aceptable en desarrollo.
   */
  const origenes = config.get<string>("WEB_ORIGIN")?.split(",").map((o) => o.trim());
  app.enableCors({ origin: origenes ?? true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);

  if (process.env.NODE_ENV === "production" && !origenes) {
    console.warn("[aviso] WEB_ORIGIN sin definir: el API acepta peticiones de cualquier origen.");
  }
}

bootstrap();
