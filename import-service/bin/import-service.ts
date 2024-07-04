#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ImportServiceStackKate } from "../lib/import-service-stack";

const app = new cdk.App();
new ImportServiceStackKate(app, "ImportServiceStackKate", {
  tags: { createdBy: "ekaterina.hubkina" },
});
