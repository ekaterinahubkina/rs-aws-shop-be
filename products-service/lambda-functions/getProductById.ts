import { APIGatewayEvent } from "aws-lambda";
import { products } from "./products";

export async function handler(event: APIGatewayEvent) {
  const productById = products.find(
    (product) => product.id === event.pathParameters?.id
  );

  if (productById) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(productById),
    };
  } else {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
}
