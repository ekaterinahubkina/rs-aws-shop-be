import { SQSEvent } from "aws-lambda";
import { TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand } from "@aws-sdk/client-sns";
import { handler } from "../lambda-functions/catalogBatchProcess";

jest.mock("@aws-sdk/client-sns", () => {
  return {
    SNSClient: jest.fn(() => ({
      send: jest.fn(),
    })),
    PublishCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDB: jest.fn().mockImplementation(() => {
      return {};
    }),
    TransactWriteItemsCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocument: {
      from: jest.fn().mockImplementation(() => {
        return {
          send: jest.fn(),
        };
      }),
    },
  };
});

describe("Catalog batch process test", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return a 400 if some of the required fields missing in the message body", async () => {
    const event = {
      Records: [
        {
          body: '{"title":"product2","description":"description of product2","price":"222"}',
        },
      ],
    } as SQSEvent;
    const res = await handler(event);
    const message = JSON.parse(res.body);
    expect(message).toEqual({
      message: "Some of the required parameters is missing",
    });
    expect(res.statusCode).toBe(400);
  });

  it("should return a 201 if products successfully created", async () => {
    const event = {
      Records: [
        {
          body: '{"title":"product2","description":"description of product2","price":"222", "count":"2"}',
        },
      ],
    } as SQSEvent;

    const res = await handler(event);

    expect(TransactWriteItemsCommand).toHaveReturned();
    expect(PublishCommand).toHaveReturned();

    const message = JSON.parse(res.body);
    expect(message).toEqual({ message: "Products successfully created" });
    expect(res.statusCode).toBe(201);
  });
});
