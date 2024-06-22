import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Function as LambdaFunction,
  Runtime,
  Code,
  FunctionProps,
} from "aws-cdk-lib/aws-lambda";
import {
  LambdaIntegration,
  RestApi,
  Model,
  JsonSchemaType,
  RequestValidator,
} from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { config } from "dotenv";

config();

export class ProductsServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
    const STOCKS_TABLE = process.env.STOCKS_TABLE ?? "";

    const productsTable = Table.fromTableName(
      this,
      "ProductsTableKate",
      PRODUCTS_TABLE
    );

    const stocksTable = Table.fromTableName(
      this,
      "StocksTableKate",
      STOCKS_TABLE
    );

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
    };

    const getProductsList = new LambdaFunction(
      this,
      "GetProductsListHandlerKate",
      {
        handler: "getProductsList.handler",
        ...lambdaFunctionProps,
      }
    );

    const getProductById = new LambdaFunction(
      this,
      "GetProductByIdHandlerKate",
      {
        handler: "getProductById.handler",
        ...lambdaFunctionProps,
      }
    );

    const createProduct = new LambdaFunction(this, "CreateProductHandlerKate", {
      handler: "createProduct.handler",
      ...lambdaFunctionProps,
    });

    // Grant the Lambda function read access to the DynamoDB table
    productsTable.grantReadWriteData(getProductsList);
    productsTable.grantReadWriteData(getProductById);
    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(getProductsList);
    stocksTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(createProduct);

    const api = new RestApi(this, "ProductServiceKate", {
      restApiName: "ProductServiceKate",
    });

    const productsPath = api.root.addResource("products");

    const productModel = new Model(this, "CreateProductValidationModelKate", {
      restApi: api,
      contentType: "application/json",
      description: "To validate the request body",
      modelName: "CreateProductValidationModelKate",
      schema: {
        type: JsonSchemaType.OBJECT,
        required: ["title", "description", "price", "count"],
        properties: {
          title: { type: JsonSchemaType.STRING },
          description: { type: JsonSchemaType.STRING },
          price: { type: JsonSchemaType.INTEGER },
          count: { type: JsonSchemaType.INTEGER },
        },
      },
    });

    productsPath.addMethod("GET", new LambdaIntegration(getProductsList));
    productsPath.addMethod("POST", new LambdaIntegration(createProduct), {
      requestValidator: new RequestValidator(
        this,
        "CreateProductBodyValidatorKate",
        {
          restApi: api,
          requestValidatorName: "CreateProductBodyValidatorKate",
          validateRequestBody: true,
        }
      ),
      requestModels: {
        "application/json": productModel,
      },
    });

    const productByIdPath = productsPath.addResource("{id}");

    productByIdPath.addMethod("GET", new LambdaIntegration(getProductById));
  }
}
