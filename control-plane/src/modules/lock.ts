import lock from "advisory-lock";

const locker = lock(process.env.DATABASE_URL!);

export const createMutex = (name: string) => {
  const mutex = locker(name);

  return mutex;
};
