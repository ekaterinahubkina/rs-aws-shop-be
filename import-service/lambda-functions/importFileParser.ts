import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import * as stream from "stream";

const BUCKET_NAME = process.env.BUCKET_NAME || "";

const client = new S3Client();

export async function handler(event: S3Event) {
  console.log("Import products file handler incoming request", event);

  const bucketName = event.Records[0].s3.bucket.name;
  const fileName = event.Records[0].s3.object.key;

  console.log("fileName", fileName);

  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    const parsedKey = fileName.replace("uploaded/", "parsed/");

    // const copyCommand = new CopyObjectCommand({
    //   Bucket: bucketName, // the new bucket (if supplied)
    //   CopySource: fileName, // the location of the file to be copied
    //   Key: parsedKey, // the new location
    // });

    // const deleteCommand = new DeleteObjectCommand({
    //   Bucket: bucketName,
    //   Key: fileName,
    // });

    const res = await client.send(getCommand);

    console.log("RES", res);

    const parsed: { [key: string]: string }[] = [];

    if (res.Body instanceof stream.Readable) {
      res.Body.pipe(csv())
        .on("data", (data: { [key: string]: string }) => parsed.push(data))
        .on("end", () => {
          console.log("Parsed CSV:", parsed);
        });
    } else {
      throw new Error("Not a readable stream");
    }

    // const copyRes = await client.send(copyCommand);

    // console.log("copy result", copyRes);

    // const deleteRes = await client.send(deleteCommand);

    // console.log("delete result", deleteRes);
  } catch (error) {
    console.error("Error", error);
  }
}
