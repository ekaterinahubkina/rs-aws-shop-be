import { APIGatewayEvent } from "aws-lambda";
import { products } from "./products";

export async function handler(event: Partial<APIGatewayEvent>) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
    },
    body: JSON.stringify(products),
  };
}
