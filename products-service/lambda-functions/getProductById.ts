import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export async function handler(event: Partial<APIGatewayEvent>) {
  console.log("Get product by id handler incoming request", event);

  const productId = event.pathParameters?.id;
  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify({ message: "Product id is missing." }),
    };
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
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
        body: JSON.stringify(joinedProduct),
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
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(error),
    };
  }
}
