import { createResponse } from "./utils/create-response";
import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
} from "aws-lambda";
import { PolicyEffect, generatePolicy } from "./utils/generate-policy";

export async function handler(event: APIGatewayRequestAuthorizerEvent) {
  console.log("Basic authorizer handler incoming event", event);

  const auth = event.headers?.["Authorization"] || "";
  const [, authToken] = auth.split(" ");

  if (!authToken || event.type !== "REQUEST") {
    return createResponse({
      statusCode: 401,
      body: { message: "Unauthorized" },
    });
  }

  try {
    const buff = Buffer.from(authToken, "base64");
    const [username, password] = buff.toString("utf-8").split(":");

    console.log(`Username: ${username}, password: ${password}`);

    const validPassword = process.env[username];

    const effect =
      !validPassword || password !== validPassword
        ? PolicyEffect.DENY
        : PolicyEffect.ALLOW;

    const policy = generatePolicy({
      resource: event.methodArn,
      effect,
    });

    const response: APIGatewayAuthorizerResult = {
      principalId: authToken,
      policyDocument: policy,
    };

    return response;
  } catch (error) {
    return createResponse({
      statusCode: 401,
      body: { message: `Unauthorized: ${error}` },
    });
  }
}
