#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ProductsServiceStackKate } from "../lib/products-service-stack";

const app = new cdk.App();
new ProductsServiceStackKate(app, "ProductsServiceStackKate", {
  tags: { createdBy: "ekaterina.hubkina" },
});
