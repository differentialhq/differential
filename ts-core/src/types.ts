export type Serializable =
  | string
  | number
  | boolean
  | SerializableObject
  | null
  | undefined
  | Buffer
  | Date
  | bigint
  | Array<Serializable>;

type SerializableObject = {
  [key: string]: Serializable;
};

export type AsyncFunction = (...args: Serializable[]) => Promise<Serializable>;
