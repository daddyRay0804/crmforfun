import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { StatsService } from './stats.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('summary')
  @Roles('Admin', 'Finance')
  async summary(@Req() req: any) {
    const userId = String(req.user?.sub ?? '');
    return this.stats.summary(userId);
  }

  @Get('summary-range')
  @Roles('Admin', 'Finance')
  async summaryRange(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    const userId = String(req.user?.sub ?? '');
    return this.stats.summaryRange(userId, { from, to });
  }

  @Get('agents-top')
  @Roles('Admin', 'Finance')
  async agentsTop(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = String(req.user?.sub ?? '');
    return this.stats.topAgents(userId, {
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
