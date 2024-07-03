import * as cdk from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  Function as LambdaFunction,
  Runtime,
  Code,
  FunctionProps,
} from "aws-cdk-lib/aws-lambda";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as path from "path";
import { config } from "dotenv";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Queue } from "aws-cdk-lib/aws-sqs";

config();

export class ImportServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const BUCKET_NAME = process.env.BUCKET_NAME ?? "";
    const SQS_ARN = process.env.SQS_ARN ?? "";
    const SQS_URL = process.env.SQS_URL ?? "";

    const importServiceBucket = Bucket.fromBucketName(
      this,
      "importServiceBucketKate",
      BUCKET_NAME
    );

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: { BUCKET_NAME, SQS_URL },
    };

    const importProductsFile = new LambdaFunction(
      this,
      "ImportProductsFileHandlerKate",
      {
        handler: "importProductsFile.handler",
        ...lambdaFunctionProps,
      }
    );

    const importFileParser = new LambdaFunction(
      this,
      "ImportFileParserHandlerKate",
      {
        handler: "importFileParser.handler",
        ...lambdaFunctionProps,
      }
    );

    const catalogItemsQueue = Queue.fromQueueArn(
      this,
      "CatalogItemsQueueKate",
      SQS_ARN
    );

    catalogItemsQueue.grantSendMessages(importFileParser);

    importServiceBucket.grantReadWrite(importProductsFile);
    importServiceBucket.grantReadWrite(importFileParser);
    importServiceBucket.grantDelete(importFileParser);

    importServiceBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParser),
      { prefix: "uploaded/" }
    );

    const api = new RestApi(this, "ImportServiceKate", {
      restApiName: "ImportServiceKate",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const importPath = api.root.addResource("import");

    importPath.addMethod("GET", new LambdaIntegration(importProductsFile), {
      requestParameters: {
        "method.request.querystring.name": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
    });
  }
}
