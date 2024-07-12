import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { createResponse } from "./utils/create-response";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export async function handler(event: Partial<APIGatewayEvent>) {
  console.log("Get product by id handler incoming request", event);

  const productId = event.pathParameters?.id;

  if (!productId) {
    return createResponse({
      statusCode: 400,
      body: { message: "Product id is missing" },
    });
  }

  try {
    const { Item: product } = await db.get({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
    });

    const { Item: stock } = await db.get({
      TableName: STOCKS_TABLE,
      Key: { product_id: productId },
    });

    if (product && stock) {
      const joinedProduct = { ...product, count: stock.count };
      return createResponse({
        statusCode: 200,
        body: joinedProduct,
      });
    } else {
      return createResponse({
        statusCode: 404,
        body: { message: "Product not found" },
      });
    }
  } catch (error) {
    return createResponse({
      statusCode: 500,
      body: error,
    });
  }
}
