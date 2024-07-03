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
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { config } from "dotenv";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { FilterOrPolicy, SubscriptionFilter, Topic } from "aws-cdk-lib/aws-sns";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

config();

export class ProductsServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE ?? "";
    const STOCKS_TABLE = process.env.STOCKS_TABLE ?? "";
    const EMAIL_ONE = process.env.EMAIL_ONE ?? "";
    const EMAIL_TWO = process.env.EMAIL_TWO ?? "";

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

    const createProductTopic = new Topic(this, "createProductTopicKate", {
      topicName: "createProductTopicKate",
    });

    createProductTopic.addSubscription(
      new EmailSubscription(EMAIL_ONE, {
        filterPolicyWithMessageBody: {
          count: FilterOrPolicy.filter(
            SubscriptionFilter.numericFilter({ greaterThanOrEqualTo: 5 })
          ),
        },
      })
    );

    createProductTopic.addSubscription(
      new EmailSubscription(EMAIL_TWO, {
        filterPolicyWithMessageBody: {
          count: FilterOrPolicy.filter(
            SubscriptionFilter.numericFilter({ lessThan: 5 })
          ),
        },
      })
    );

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
        SNS_TOPIC_ARN: createProductTopic.topicArn,
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

    const catalogBatchProcess = new LambdaFunction(
      this,
      "CatalogBatchProcessHandlerKate",
      {
        handler: "catalogBatchProcess.handler",
        ...lambdaFunctionProps,
      }
    );

    const deadLetterQueue = new Queue(this, "DeadLetterQueueKate");

    const catalogItemsQueue = new Queue(this, "CatalogItemsQueueKate", {
      queueName: "catalogItemsQueueKate",
      deadLetterQueue: { queue: deadLetterQueue, maxReceiveCount: 1 },
    });

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

    // Grant the Lambda function read access to the DynamoDB table
    productsTable.grantReadWriteData(getProductsList);
    productsTable.grantReadWriteData(getProductById);
    productsTable.grantReadWriteData(createProduct);
    productsTable.grantReadWriteData(catalogBatchProcess);
    stocksTable.grantReadWriteData(getProductsList);
    stocksTable.grantReadWriteData(getProductById);
    stocksTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(catalogBatchProcess);

    createProductTopic.grantPublish(catalogBatchProcess);

    const api = new RestApi(this, "ProductServiceKate", {
      restApiName: "ProductServiceKate",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
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
