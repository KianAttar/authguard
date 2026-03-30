import { SESClient, SendEmailCommand, MessageRejected } from "@aws-sdk/client-ses";
import { ENV } from "../config/config.js";

interface Options {
    code: string;
    to: string;
}
async function sendEmail({ code, to }: Options) {
    const cmd = new SendEmailCommand({
        Source: "h.a.develops@gmail.com",
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: "MFA Code from AuthGuard", Charset: "utf8" },
            Body: {
                Text: {
                    Data: `Dear User,\n\nYour code is: ${code}\n\nRegards,\nAuthGuard`,
                    Charset: "utf8"
                }
            }
        }
    });

    const client = new SESClient({
        region: "us-east-1",
        credentials: {
            accessKeyId: ENV.AWS_SES_ACCESS_KEY,
            secretAccessKey: ENV.AWS_SES_SECRET_ACCESS_KEY
        }
    });
    try {
        const res = await client.send(cmd);
        console.log(res);
    } catch (err) {
        console.log("ERROR in send Email");
        console.log(err);
        throw err;
    }
}

export { sendEmail };
