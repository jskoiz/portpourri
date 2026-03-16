import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('App')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Return a basic backend health greeting' })
  @ApiOkResponse({ description: 'Greeting returned successfully.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
