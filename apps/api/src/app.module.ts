import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { CreditLimitsModule } from './credit-limits/credit-limits.module';
import { CreditLimitRequestsModule } from './credit-limit-requests/credit-limit-requests.module';
import { DepositOrdersModule } from './deposit-orders/deposit-orders.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersAdminModule } from './users/users-admin.module';

@Module({
  imports: [
    AuthModule,
    AgentsModule,
    UsersAdminModule,
    CreditLimitsModule,
    CreditLimitRequestsModule,
    DepositOrdersModule,
    PaymentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
