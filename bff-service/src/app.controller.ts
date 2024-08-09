import {
  Controller,
  All,
  Req,
  Res,
  Param,
  Query,
  Body,
  HttpStatus,
  BadGatewayException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { ALLOWED_ROUTES, Service } from './constants/services';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @All(':service/*')
  async handleAll(
    @Res() res: Response,
    @Param('service') service: Service,
    @Req() req: Request,
    @Query() query: string,
    @Body() body: any,
  ) {
    if (!ALLOWED_ROUTES.includes(service)) {
      throw new BadGatewayException('Cannot process request');
    }
    const { url, method, headers } = req;

    console.log({ url, method, headers, body, query });

    const response = await this.appService.redirectToService({
      service,
      url,
      method,
      headers,
      body,
      query,
    });

    res.status(response.status).send(response.data);
  }
}
