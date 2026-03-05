import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerController } from '../controllers/customer.controller';
import { CustomerDocument } from '@infrastructure/database/schemas/customer.schema';
import { CustomerSchema } from '@infrastructure/database/schemas/customer.schema';
import { CustomerRepositoryImpl } from '@infrastructure/repositories/customer.repository.impl';
import { TOKENS } from '@shared/constants/tokens';
import {
    CreateCustomerUseCase,
    GetCustomersUseCase,
    GetCustomerByIdUseCase
} from '@application/use-cases/customer/customer.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: CustomerDocument.name, schema: CustomerSchema }]),
    ],
    controllers: [CustomerController],
    providers: [
        { provide: TOKENS.CUSTOMER_REPOSITORY, useClass: CustomerRepositoryImpl },
        CreateCustomerUseCase,
        GetCustomersUseCase,
        GetCustomerByIdUseCase,
    ],
    exports: [TOKENS.CUSTOMER_REPOSITORY],
})
export class CustomerModule { }
