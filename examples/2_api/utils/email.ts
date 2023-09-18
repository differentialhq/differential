import nodemailer from "nodemailer";
import { d } from "./differential";

// d.background is a set-and-forget way of executing a function in the background, whereas
// d.fn is a synchronous function that returns a promise.
//
// both are designed to adhere to exactly-once semantics.
export const sendGreeting = d.background(
  async (to: string) => {
    console.log("Sending greeting to", to);

    const transporter = nodemailer.createTransport({
      port: 1025, // mailhog port
      host: "localhost",
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log(`Sending email to ${to}`);

    var message = {
      from: "noreply@example.com",
      to,
      subject: "This is a test email",
      text: `This is a test email sento to ${to}`,
    };

    transporter.sendMail(message, (error, info) => {
      console.log("Sending email to", to);

      if (error.message.includes("ECONNREFUSED")) {
        console.log(
          "Mailhog is not running. If it was running, an email would have been sent to",
          to
        );
      } else if (error) {
        console.log("Error sending email to", to, error);
      } else {
        console.log("Message sent: %s", info.messageId);
      }
    });
  },
  {
    machineType: "worker", // only run on worker nodes
  }
);
