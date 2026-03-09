import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './interfaces/modules/auth.module';
import { InvoiceModule } from './interfaces/modules/invoice.module';
import { CustomerModule } from './interfaces/modules/customer.module';
import { UserModule } from './interfaces/modules/user.module';
import { CompanyModule } from './interfaces/modules/company.module';
import { ApiKeyModule } from './interfaces/modules/api-key.module';
import { WebhookModule } from './interfaces/modules/webhook.module';

@Module({
  imports: [
    // Config global con variables de entorno
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI', 'mongodb://localhost:27017/facturaya'),
      }),
    }),

    // Rate Limiting: 100 requests/minute por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature Modules
    AuthModule,
    InvoiceModule,
    CustomerModule,
    UserModule,
    CompanyModule,
    ApiKeyModule,
    WebhookModule,
  ],
})
export class AppModule { }
