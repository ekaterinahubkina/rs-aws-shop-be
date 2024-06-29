import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  DynamoDB,
  TransactWriteItemsCommand,
  TransactWriteItemsCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { Product } from "./lambda-functions/product.interface";
import { Stock } from "./lambda-functions/stock.interface";
import { config } from "dotenv";

config();

const createProduct = (): Product => {
  return {
    id: uuidv4(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: +faker.commerce.price(),
  };
};

const createProducts = (productsCount: number): Product[] => {
  return Array.from({ length: productsCount }, createProduct);
};

const products = createProducts(10);

const crateStock = (uuid: string): Stock => {
  return {
    product_id: uuid,
    count: faker.number.int({ max: 5 }),
  };
};

const createStocks = (products: Product[]): Stock[] => {
  const stocks = [];
  for (const product of products) {
    const stock = crateStock(product.id);
    stocks.push(stock);
  }
  return stocks;
};

const stocks = createStocks(products);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;

const db = DynamoDBDocument.from(
  new DynamoDB({ credentials: fromIni({ profile: process.env.AWS_PROFILE }) })
);
const transactionItems = [];

for (const product of products) {
  transactionItems.push({
    Put: {
      Item: marshall(product),
      TableName: PRODUCTS_TABLE,
    },
  });
}

for (const stock of stocks) {
  transactionItems.push({
    Put: {
      Item: marshall(stock),
      TableName: STOCKS_TABLE,
    },
  });
}

const input: TransactWriteItemsCommandInput = {
  TransactItems: transactionItems,
};

const seedDB = async () => {
  try {
    const command = new TransactWriteItemsCommand(input);
    await db.send(command);
    console.log("Successfully seeded the tables");
  } catch (error) {
    console.log("Error while seeding the tables", error);
  }
};

(async () => {
  await seedDB();
})();
