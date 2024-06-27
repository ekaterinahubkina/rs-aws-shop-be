import { APIGatewayEvent, S3Event } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createResponse } from "./utils/create-response";

const BUCKET_NAME = process.env.BUCKET_NAME || "";

export async function handler(event: APIGatewayEvent) {
  console.log("Import products file handler incoming request", event);

  const name = event.queryStringParameters?.name;

  if (!name) {
    return createResponse({
      statusCode: 400,
      body: { message: "Name parameter is missing" },
    });
  }

  const client = new S3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `uploaded/${name}`,
  });

  try {
    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });

    return createResponse({
      statusCode: 200,
      body: { url: presignedUrl },
    });
  } catch (error) {
    return createResponse({ statusCode: 500, body: error });
  }
}
