import { createResponse } from "./utils/create-response";
import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { PolicyEffect, generatePolicy } from "./utils/generate-policy";

export async function handler(event: APIGatewayRequestAuthorizerEvent) {
  console.log("Basic authorizer handler incoming event", event);

  const authToken = event.headers?.["Authorization"] || "";

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
      creds: authToken,
      resource: event.methodArn,
      effect,
    });

    return policy;
  } catch (error) {
    return createResponse({
      statusCode: 401,
      body: { message: `Unauthorized: ${error}` },
    });
  }
}
