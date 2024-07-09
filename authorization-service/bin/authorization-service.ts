#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AuthorizationServiceStackKate } from "../lib/authorization-service-stack";

const app = new cdk.App();
new AuthorizationServiceStackKate(app, "AuthorizationServiceStackKate", {
  tags: { createdBy: "ekaterina.hubkina" },
});
