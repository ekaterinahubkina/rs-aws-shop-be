import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  DynamoDB,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { Product } from "./product.interface";
import { Stock } from "./stock.interface";
import { APIGatewayEvent } from "aws-lambda";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export const handler = async (event: Partial<APIGatewayEvent>) => {
  console.log("Create product handler incoming request", event);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: "invalid request, you are missing the parameter body",
    };
  }
  const { title, description, price, count } =
    typeof event.body == "object" ? event.body : JSON.parse(event.body);

  const newProduct: Product = {
    id: randomUUID(),
    title,
    description,
    price,
  };

  const newStock: Stock = {
    product_id: newProduct.id,
    count,
  };

  const input: TransactWriteItemsCommandInput = {
    TransactItems: [
      {
        Put: {
          Item: marshall(newProduct),
          TableName: PRODUCTS_TABLE,
        },
      },
      {
        Put: {
          Item: marshall(newStock),
          TableName: STOCKS_TABLE,
        },
      },
    ],
  };

  try {
    const command = new TransactWriteItemsCommand(input);
    await db.send(command);
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: "",
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
      body: error,
    };
  }
};
