import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Service } from './constants/services';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IncomingHttpHeaders } from 'http';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async redirectToService({
    service,
    url,
    method,
    headers,
    body,
    query,
  }: {
    service: Service;
    url: string;
    method: string;
    headers: IncomingHttpHeaders;
    body: any;
    query: string;
  }) {
    console.log('Req to service:', service);
    const serviceBaseUrl = this.configService.get(
      `${service.toUpperCase()}_SERVICE_URL`,
    );

    const serviceUrl = url.replace(`/${service}/`, serviceBaseUrl);

    console.log('ServiceUrl:', serviceUrl);

    const authToken = headers?.authorization;

    const config: AxiosRequestConfig = {
      url: serviceUrl,
      method,
      params: query,
      ...(headers && authToken
        ? { headers: { Authorization: authToken } }
        : {}),
      ...(body && Object.keys(body).length > 0 ? { data: body } : {}),
    };

    const { status, data } = await firstValueFrom(
      this.httpService.request(config).pipe(
        catchError((error: AxiosError) => {
          console.error('ERROR', error.response?.data ?? error);
          throw new HttpException(
            error.response?.data ?? 'An error occured',
            error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    const isGetProductsListReq =
      service === Service.PRODUCTS_SERVICE &&
      method === 'GET' &&
      url === '/products/products';

    if (isGetProductsListReq) {
      console.log('PRODUCTS CACHE CREATED');
      await this.cacheManager.set('products', { status, data });
    }
    return { status, data };
  }
}
