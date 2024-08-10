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
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { ALLOWED_ROUTES, Service } from './constants/services';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @All(':service/*')
  async redirectToService(
    @Res() res: Response,
    @Param('service') service: Service,
    @Req() req: Request,
    @Query() query: string,
    @Body() body: any,
  ) {
    if (!ALLOWED_ROUTES.includes(service)) {
      throw new BadGatewayException('Cannot process request');
    }

    const cachedProducts: { status: HttpStatus; data: any } | undefined =
      await this.cacheManager.get('products');

    const { url, method, headers } = req;

    if (
      service === Service.PRODUCTS_SERVICE &&
      method === 'GET' &&
      cachedProducts
    ) {
      console.log('RETURNING PRODUCTS FROM CACHE', cachedProducts);
      return res.status(cachedProducts.status).send(cachedProducts.data);
    }

    delete headers.host;
    delete headers.referer;

    const response = await this.appService.redirectToService({
      service,
      url,
      method,
      headers,
      body,
      query,
    });

    return res.status(response.status).send(response.data);
  }
}
