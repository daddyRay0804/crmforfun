import { Body, Controller, Get, NotFoundException, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreditLimitsService } from './credit-limits.service';

class UpsertCreditLimitDto {
  creditLimitAmount!: number;
  firstFeeAmount!: number;
  note?: string | null;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents/:agentId/credit-limit')
export class CreditLimitsController {
  constructor(private readonly creditLimits: CreditLimitsService) {}

  @Get()
  @Roles('Admin', 'Finance')
  async getOne(@Param('agentId') agentId: string) {
    const found = await this.creditLimits.getByAgentId(agentId);
    if (!found) throw new NotFoundException('credit limit not set');
    return { data: found };
  }

  @Put()
  @Roles('Admin', 'Finance')
  async upsert(@Param('agentId') agentId: string, @Body() body: UpsertCreditLimitDto) {
    return {
      data: await this.creditLimits.upsertByAgentId({
        agentId,
        creditLimitAmount: Number(body.creditLimitAmount ?? 0),
        firstFeeAmount: Number(body.firstFeeAmount ?? 0),
        note: body.note ?? null,
      }),
    };
  }
}
