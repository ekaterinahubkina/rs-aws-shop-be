import * as cdk from "aws-cdk-lib";
import {
  Function as LambdaFunction,
  Runtime,
  Code,
  FunctionProps,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { config } from "dotenv";

config();

export class AuthorizationServiceStackKate extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const AUTH_CREDS = process.env.ekaterinahubkina ?? "";

    const lambdaFunctionProps: Omit<FunctionProps, "handler"> = {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      environment: { AUTH_CREDS },
    };

    const basicAuthorizer = new LambdaFunction(
      this,
      "BasicAuthorizerHandlerKate",
      {
        handler: "basicAuthorizer.handler",
        ...lambdaFunctionProps,
      }
    );
  }
}
