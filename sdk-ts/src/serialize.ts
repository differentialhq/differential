import msgpackr from "msgpackr";

export const pack = (data: unknown): string => {
  return msgpackr.pack(data).toString("base64");
};
export const unpack = (data: string) => {
  return msgpackr.unpack(Buffer.from(data, "base64"));
};
