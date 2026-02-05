import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WithdrawalRequestsService } from './withdrawal-requests.service';

class CreateWithdrawalRequestDto {
  amount!: number;
  currency?: string;
  memo?: string;
}

class ReviewDto {
  memo?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdrawal-requests')
export class WithdrawalRequestsController {
  constructor(private readonly withdrawals: WithdrawalRequestsService) {}

  @Get()
  @Roles('Admin', 'Finance', 'Agent_Normal', 'Agent_Credit')
  async list(@Req() req: any) {
    const userId = String(req.user?.sub ?? '');
    const role = req.user?.role as string | undefined;
    return { data: await this.withdrawals.listForUser(userId, role) };
  }

  @Post()
  @Roles('Agent_Normal', 'Agent_Credit')
  async create(@Req() req: any, @Body() body: CreateWithdrawalRequestDto) {
    const userId = String(req.user?.sub ?? '');
    return { data: await this.withdrawals.createForUser(userId, body) };
  }

  @Post(':id/freeze')
  @Roles('Admin', 'Finance')
  async freeze(@Req() req: any, @Param('id') id: string, @Body() body: ReviewDto) {
    const reviewerId = String(req.user?.sub ?? '');
    return { data: await this.withdrawals.freeze(id, reviewerId, body) };
  }

  @Post(':id/approve')
  @Roles('Admin', 'Finance')
  async approve(@Req() req: any, @Param('id') id: string, @Body() body: ReviewDto) {
    const reviewerId = String(req.user?.sub ?? '');
    return { data: await this.withdrawals.approve(id, reviewerId, body) };
  }

  @Post(':id/reject')
  @Roles('Admin', 'Finance')
  async reject(@Req() req: any, @Param('id') id: string, @Body() body: ReviewDto) {
    const reviewerId = String(req.user?.sub ?? '');
    return { data: await this.withdrawals.reject(id, reviewerId, body) };
  }

  @Post(':id/payout')
  @Roles('Admin', 'Finance')
  async payout(@Req() req: any, @Param('id') id: string, @Body() body: ReviewDto) {
    const reviewerId = String(req.user?.sub ?? '');
    return { data: await this.withdrawals.payout(id, reviewerId, body) };
  }
}
