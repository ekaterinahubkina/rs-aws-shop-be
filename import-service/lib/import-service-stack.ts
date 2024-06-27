import * as cdk from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import {
  Function as LambdaFunction,
  Runtime,
  Code,
  FunctionProps,
} from "aws-cdk-lib/aws-lambda";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as path from "path";
import { config } from "dotenv";

config();

export class ImportServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const BUCKET_NAME = process.env.BUCKET_NAME ?? "";

    const importServiceBucket = Bucket.fromBucketName(
      this,
      "importServiceBucketKate",
      BUCKET_NAME
    );

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: { BUCKET_NAME },
    };

    const importProductsFile = new LambdaFunction(
      this,
      "ImportProductsFileHandlerKate",
      {
        handler: "importProductsFile.handler",
        ...lambdaFunctionProps,
      }
    );

    importServiceBucket.grantReadWrite(importProductsFile);

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
