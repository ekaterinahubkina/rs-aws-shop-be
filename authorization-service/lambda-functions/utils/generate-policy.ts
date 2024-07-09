import { PolicyDocument } from "aws-lambda";

export enum PolicyEffect {
  ALLOW = "Allow",
  DENY = "Deny",
}

export const generatePolicy = ({
  creds,
  resource,
  effect,
}: {
  creds: string;
  resource: string;
  effect: PolicyEffect;
}): PolicyDocument => {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  };
};
