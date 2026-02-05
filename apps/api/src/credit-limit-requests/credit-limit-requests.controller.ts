import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { JwtPayload } from '../auth/auth.service';
import { CreditLimitRequestsService } from './credit-limit-requests.service';

class CreateCreditLimitRequestDto {
  requestedAmount!: number;
  note?: string | null;
}

class DecideCreditLimitRequestDto {
  action!: 'approve' | 'reject';
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CreditLimitRequestsController {
  constructor(private readonly creditLimitRequests: CreditLimitRequestsService) {}

  @Get('agents/:agentId/credit-limit-requests')
  @Roles('Admin', 'Finance', 'Agent_Credit')
  async list(@Param('agentId') agentId: string) {
    return { data: await this.creditLimitRequests.listByAgentId(agentId) };
  }

  @Post('agents/:agentId/credit-limit-requests')
  @Roles('Admin', 'Agent_Credit')
  async create(
    @Param('agentId') agentId: string,
    @Body() body: CreateCreditLimitRequestDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user as JwtPayload;
    return {
      data: await this.creditLimitRequests.create({
        agentId,
        requestedAmount: Number(body.requestedAmount ?? 0),
        note: body.note ?? null,
        createdByUserId: user?.sub ?? null,
      }),
    };
  }

  @Post('credit-limit-requests/:id/decide')
  @Roles('Admin', 'Finance')
  async decide(@Param('id') id: string, @Body() body: DecideCreditLimitRequestDto, @Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    const status = body.action === 'approve' ? 'Approved' : 'Rejected';
    return {
      data: await this.creditLimitRequests.decide({
        id,
        status,
        decidedByUserId: user?.sub ?? null,
      }),
    };
  }
}
