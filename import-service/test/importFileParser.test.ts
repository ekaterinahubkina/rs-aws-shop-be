import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { handler } from "../lambda-functions/importFileParser";

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn(() => ({
      send: jest.fn(),
    })),
    GetObjectCommand: jest.fn(),
    CopyObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

describe("Import file parser test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fileName = "uploaded/some-file.csv";
  const bucketName = "some-bucket";
  const parsedKey = "parsed/some-file.csv";

  it('should parse the csv file, copy to "parsed" folder, delete from "uploaded"', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: bucketName },
            object: { key: fileName },
          },
        },
      ],
    } as S3Event;

    await handler(event);

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: bucketName,
      Key: fileName,
    });

    expect(GetObjectCommand).toHaveReturned();

    expect(CopyObjectCommand).toHaveBeenCalledWith({
      Bucket: bucketName,
      CopySource: `${bucketName}/${fileName}`,
      Key: parsedKey,
    });

    expect(CopyObjectCommand).toHaveReturned();

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: bucketName,
      Key: fileName,
    });

    expect(DeleteObjectCommand).toHaveReturned();
  });
});
