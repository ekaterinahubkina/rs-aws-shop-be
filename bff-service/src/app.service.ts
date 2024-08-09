import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Service } from './constants/services';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
    headers: any;
    body: any;
    query: string;
  }) {
    console.log('service', service);
    const serviceBaseUrl = this.configService.get(
      `${service.toUpperCase()}_SERVICE_URL`,
    );

    const serviceUrl = url.replace(`/${service}/`, serviceBaseUrl);

    console.log('serviceUrl', serviceUrl);

    const config: AxiosRequestConfig = {
      url: serviceUrl,
      method: method,
      params: query,
      headers: headers,
      ...(body && Object.keys(body).length > 0 ? { data: body } : {}),
    };

    const { status, data } = await firstValueFrom(
      this.httpService.request(config).pipe(
        catchError((error: AxiosError) => {
          console.error(error.response?.data ?? error);
          throw new HttpException(
            error.response?.data ?? 'An error occured',
            error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return { status, data };
  }
}
