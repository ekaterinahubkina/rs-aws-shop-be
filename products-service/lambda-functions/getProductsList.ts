import { APIGatewayEvent } from "aws-lambda";
import { products } from "./products";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { createResponse } from "./utils/create-response";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export async function handler(event: Partial<APIGatewayEvent>) {
  console.log("Get all products handler incoming request", event);

  try {
    const { Items: products } = await db.scan({ TableName: PRODUCTS_TABLE });
    const { Items: stocks } = await db.scan({ TableName: STOCKS_TABLE });

    const joinedRes = products?.reduce((acc, item) => {
      const relatedStock = stocks?.find(
        (stock) => stock.product_id === item.id
      );
      const product = { ...item, count: relatedStock?.count };
      acc.push(product);
      return acc;
    }, []);

    return createResponse({
      statusCode: 200,
      body: joinedRes,
    });
  } catch (error) {
    return createResponse({
      statusCode: 500,
      body: error,
    });
  }
}
