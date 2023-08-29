import { Request, Response } from "express";
import process from "process";
import { sendGreeting } from "./utils/email";

export const sayHello = (req: Request, res: Response) => {
  res.send(`Hello World from pid ${process.pid}`);
};

export const sendEmail = async (req: Request, res: Response) => {
  const result = await sendGreeting(req.query.to as string);

  res.send(`An e-mail will be sent to ${req.query.to}. Job id=${result.id}`);
};
