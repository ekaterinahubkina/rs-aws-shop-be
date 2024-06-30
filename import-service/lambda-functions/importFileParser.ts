import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import * as stream from "stream";

const client = new S3Client();

export async function handler(event: S3Event) {
  console.log("Import products file handler incoming request", event);

  const bucketName = event.Records[0].s3.bucket.name;
  const fileName = event.Records[0].s3.object.key;

  try {
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    const parsedKey = fileName.replace("uploaded/", "parsed/");

    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${fileName}`,
      Key: parsedKey,
    });

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    const res = await client.send(getCommand);

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
    //copy to "parsed/"
    await client.send(copyCommand);
    //delete from "uploaded"
    await client.send(deleteCommand);

    console.log(
      'Succesfully parsed the csv and moved the file from "uploaded" to "parsed" folder'
    );
  } catch (error) {
    console.error("Error", error);
  }
}
