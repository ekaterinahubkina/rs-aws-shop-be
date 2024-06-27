import { APIGatewayProxyResult } from "aws-lambda";

const defaultHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
};

export const createResponse = ({
  statusCode,
  body,
  headers,
}: {
  statusCode: number;
  body: any;
  headers?: {
    [header: string]: string;
  };
}): APIGatewayProxyResult => ({
  statusCode,
  headers: { ...defaultHeaders, ...(headers ?? {}) },
  body: JSON.stringify(body),
});
