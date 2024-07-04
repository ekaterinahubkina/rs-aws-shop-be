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
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "";
const STOCKS_TABLE = process.env.STOCKS_TABLE || "";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";

const db = DynamoDBDocument.from(new DynamoDB());
export const snsClient = new SNSClient({});

export async function handler(event: SQSEvent) {
  console.log("Incoming SQS event", event);
  const transactItems: TransactWriteItem[] = [];
  const productsForSns: Product[] = [];
  try {
    for (const message of event.Records) {
      const { title, description, price, count } =
        typeof message.body == "object"
          ? message.body
          : JSON.parse(message.body);

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

      const productForSns = { ...newProduct, count: newStock.count };
      productsForSns.push(productForSns);

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

    await db.send(command);

    await snsClient.send(
      new PublishCommand({
        Subject: "Products created",
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify({
          message: "Products from the csv successfully added to the DB",
          products: productsForSns,
          count: productsForSns.length,
        }),
      })
    );

    return createResponse({
      statusCode: 201,
      body: { message: "Products successfully created" },
    });
  } catch (error) {
    console.log("ERROR", error);
    return createResponse({ statusCode: 500, body: error });
  }
}
