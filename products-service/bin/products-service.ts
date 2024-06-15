#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductsServiceStack } from "../lib/products-service-stack";

const app = new cdk.App();
new ProductsServiceStack(app, "ProductsServiceStack", {
  tags: { createdBy: "ekaterina.hubkina" },
});
