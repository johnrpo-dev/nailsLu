import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { CARPETA_SUBIDAS } from "./modules/services/application/service-images.service";

/**
 * Comprueba la configuracion critica antes de levantar nada.
 *
 * Arrancar en produccion con el secreto de ejemplo dejaria el panel abierto:
 * ese valor esta publicado en el repositorio y cualquiera podria fabricarse un
 * token de administradora. Es preferible no arrancar a arrancar inseguro.
 */
function verificarConfiguracion() {
  if (process.env.NODE_ENV !== "production") return;

  const secreto = process.env.JWT_ACCESS_SECRET;
  const problemas: string[] = [];

  if (!secreto) {
    problemas.push("JWT_ACCESS_SECRET no esta definido.");
  } else if (secreto.startsWith("change-me")) {
    problemas.push("JWT_ACCESS_SECRET sigue con el valor de ejemplo, que es publico.");
  } else if (secreto.length < 32) {
    problemas.push("JWT_ACCESS_SECRET es demasiado corto: usa al menos 32 caracteres.");
  }

  if (!process.env.WEB_ORIGIN) {
    problemas.push("WEB_ORIGIN no esta definido: el API aceptaria peticiones de cualquier sitio.");
  }

  if (problemas.length > 0) {
    console.error("");
    console.error("No se puede arrancar en produccion:");
    for (const problema of problemas) console.error("  - " + problema);
    console.error("");
    console.error("Genera un secreto con este comando y ponlo en apps/api/.env:");
    console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"");
    console.error("");
    process.exit(1);
  }
}

async function bootstrap() {
  verificarConfiguracion();

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

  /**
   * `crossOriginResourcePolicy` por defecto es "same-origin" y bloquearia que
   * la web cargue las fotos servidas desde el API, que corre en otro puerto.
   */
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  /**
   * En produccion `WEB_ORIGIN` debe listar los dominios del sitio. Si falta,
   * se acepta cualquier origen, que solo es aceptable en desarrollo.
   *
   * Va ANTES de los archivos estaticos: registrado despues, las respuestas de
   * las fotos no pasarian por su middleware y saldrian sin cabeceras CORS.
   */
  const origenes = config.get<string>("WEB_ORIGIN")?.split(",").map((o) => o.trim());
  app.enableCors({ origin: origenes ?? true, credentials: true });

  /**
   * Fotos de los servicios. Se sirven desde disco y no desde `dist`, para que
   * sobrevivan a cada compilacion. Cache larga porque el nombre del archivo
   * cambia en cada subida: si la foto cambia, cambia la URL.
   *
   * Las cabeceras se fijan aqui ademas del middleware global, porque
   * `express.static` responde y corta la cadena antes de llegar a el.
   */
  app.useStaticAssets(CARPETA_SUBIDAS, {
    prefix: "/uploads/",
    maxAge: "365d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", origenes?.[0] ?? "*");
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>("PORT") ?? 3001;
  await app.listen(port);
}

bootstrap();
