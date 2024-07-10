import * as cdk from "aws-cdk-lib";
import {
  AuthorizationType,
  Cors,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
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
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";
import { Queue } from "aws-cdk-lib/aws-sqs";

config();

export class ImportServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const BUCKET_NAME = process.env.BUCKET_NAME ?? "";
    const SQS_ARN = process.env.SQS_ARN ?? "";
    const BASIC_AUTHORIZER_LAMBDA_ARN =
      process.env.BASIC_AUTHORIZER_LAMBDA_ARN ?? "";

    const importServiceBucket = Bucket.fromBucketName(
      this,
      "importServiceBucketKate",
      BUCKET_NAME
    );

    const catalogItemsQueue = Queue.fromQueueArn(
      this,
      "CatalogItemsQueueKate",
      SQS_ARN
    );

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: { BUCKET_NAME, SQS_URL: catalogItemsQueue.queueUrl },
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

    const basicAuthorizer = LambdaFunction.fromFunctionAttributes(
      this,
      "BasicAuthorizerHandlerKate",
      { functionArn: BASIC_AUTHORIZER_LAMBDA_ARN, sameEnvironment: true }
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

    const authorizer = new RequestAuthorizer(this, "AuthorizerKate", {
      handler: basicAuthorizer,
      identitySources: [IdentitySource.header("Authorization")],
      resultsCacheTtl: cdk.Duration.seconds(0),
    });

    importPath.addMethod("GET", new LambdaIntegration(importProductsFile), {
      requestParameters: {
        "method.request.querystring.name": true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      },
      authorizer: authorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
