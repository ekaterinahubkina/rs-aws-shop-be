import {
  DynamoDB,
  TransactWriteItem,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { SQSEvent } from "aws-lambda";
import { randomUUID } from "crypto";
import { Product } from "./product.interface";
import { Stock } from "./stock.interface";
import { marshall } from "@aws-sdk/util-dynamodb";
import { createResponse } from "./utils/create-response";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";

const db = DynamoDBDocument.from(new DynamoDB());

export async function handler(event: SQSEvent) {
  console.log("Catalog Batch Process handler incoming request", event);

  try {
    const transactItems: TransactWriteItem[] = [];
    for (const message of event.Records) {
      console.log("message", message);
      const { title, description, price, count } =
        typeof message.body == "object"
          ? message.body
          : JSON.parse(message.body);

      console.log(title, description, price, count);

      if (!title || !description || !price || !count) {
        return createResponse({
          statusCode: 400,
          body: { message: "Some of the required parameters is missing" },
        });
      }

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

      const putProduct = {
        Put: {
          Item: marshall(newProduct),
          TableName: PRODUCTS_TABLE,
        },
      };

      const putStock = {
        Put: {
          Item: marshall(newStock),
          TableName: STOCKS_TABLE,
        },
      };

      transactItems.push(putProduct, putStock);
    }

    const command = new TransactWriteItemsCommand({
      TransactItems: transactItems,
    });

    const res = await db.send(command);
    console.log("DB trx res", res);

    return createResponse({
      statusCode: 201,
      body: { message: "Products successfully created" },
    });
  } catch (error) {
    console.log("ERROR", error);
    return createResponse({ statusCode: 500, body: error });
  }
}
