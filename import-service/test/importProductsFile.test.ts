const mockFileName = "some-file.csv";
const mockBucketName = "some-bucket";
const mockPresignedUrl = `${mockBucketName}/${mockFileName}`;

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handler } from "../lambda-functions/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: jest.fn().mockReturnValue(mockPresignedUrl),
  };
});

describe("Import csv file test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a presigned url", async () => {
    const event = {
      queryStringParameters: { name: mockFileName },
    } as unknown as APIGatewayProxyEvent;

    const res = await handler(event);
    const message = JSON.parse(res.body);
    expect(message).toEqual({ url: mockPresignedUrl });
    expect(res.statusCode).toBe(200);
  });

  it("should return a 400 if name param is missing", async () => {
    const event = {} as unknown as APIGatewayProxyEvent;

    const res = await handler(event);
    const message = JSON.parse(res.body);
    expect(message).toEqual({ message: "Name parameter is missing" });
    expect(res.statusCode).toBe(400);
  });
});
