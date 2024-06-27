import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import * as fs from "fs";

const BUCKET_NAME = process.env.BUCKET_NAME || "";

const client = new S3Client();

export async function handler(event: S3Event) {
  console.log("Import products file handler incoming request", event);

  const bucketName = event.Records[0].s3.bucket.name;
  const fileName = event.Records[0].s3.object.key;

  console.log("fileName", fileName);

  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  const copyCommand = new CopyObjectCommand({
    Bucket: bucketName, // the new bucket (if supplied)
    CopySource: `uploaded/${fileName}`, // the location of the file to be copied
    Key: `parsed/${fileName}`, // the new location
  });

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: `uploaded/${fileName}`,
  });

  try {
    const res = await client.send(getCommand);
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const str = await res.Body?.transformToString();
    console.log(str);

    const parsed: { [key: string]: string }[] = [];

    fs.createReadStream(fileName)
      .pipe(csv())
      .on("data", (data) => parsed.push(data))
      .on("end", () => {
        console.log("parsed", parsed);
      });

    const copyRes = await client.send(copyCommand);

    console.log("copy result", copyRes);

    const deleteRes = await client.send(deleteCommand);

    console.log("delete result", deleteRes);
  } catch (error) {
    console.error("Error", error);
    throw new Error((error as Error).message ?? "An error occured");
  }
}
