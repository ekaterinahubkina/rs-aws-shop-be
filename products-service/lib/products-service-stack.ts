import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Function as LambdaFunction,
  Runtime,
  Code,
} from "aws-cdk-lib/aws-lambda";
import {
  LambdaIntegration,
  LambdaRestApi,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new LambdaFunction(this, "GetProductsListHandler", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      handler: "getProductsList.handler",
    });

    const getProductById = new LambdaFunction(this, "GetProductByIdHandler", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset(path.join(__dirname + "/../lambda-functions")),
      handler: "getProductById.handler",
    });

    const api = new RestApi(this, "ProductService", {
      restApiName: "ProductService",
    });

    const productsPath = api.root.addResource("products");

    productsPath.addMethod("GET", new LambdaIntegration(getProductsList));

    const productByIdPath = api.root.addResource("{id}");

    productByIdPath.addMethod("GET", new LambdaIntegration(getProductById));
  }
}
