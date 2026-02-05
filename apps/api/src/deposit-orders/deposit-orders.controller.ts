import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DepositOrdersService } from './deposit-orders.service';

class CreateDepositOrderDto {
  amount!: number;
  currency?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deposit-orders')
export class DepositOrdersController {
  constructor(private readonly deposits: DepositOrdersService) {}

  @Get()
  @Roles('Admin', 'Finance', 'Agent_Normal', 'Agent_Credit')
  async list(@Req() req: any) {
    const userId = String(req.user?.sub ?? '');
    const role = req.user?.role as string | undefined;
    return { data: await this.deposits.listForUser(userId, role) };
  }

  @Post()
  @Roles('Agent_Normal', 'Agent_Credit')
  async create(@Req() req: any, @Body() body: CreateDepositOrderDto) {
    const userId = String(req.user?.sub ?? '');
    return { data: await this.deposits.createForUser(userId, body) };
  }
}
