import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './interfaces/http/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Pipes de validación globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Descarta propiedades no decoradas
      forbidNonWhitelisted: true,
      transform: true,        // Transforma tipos automáticamente
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro de excepciones global
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FacturaYa API')
    .setDescription('SaaS de Facturación Electrónica DIAN Colombia - Clean Architecture')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y registro')
    .addTag('Invoices', 'Gestión de facturas electrónicas')
    .addTag('Customers', 'Gestión de clientes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`\n🚀 FacturaYa Backend corriendo en: http://localhost:${port}`);
  console.log(`📚 Swagger docs en: http://localhost:${port}/api/docs`);
  console.log(`🌱 Entorno: ${process.env.NODE_ENV ?? 'development'}\n`);
}

bootstrap();
