import { APIGatewayEvent } from "aws-lambda";
import { products } from "./products";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export async function handler(event: Partial<APIGatewayEvent>) {
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

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(joinedRes),
    };
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
