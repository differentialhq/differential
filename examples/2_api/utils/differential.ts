import { Differential } from "@differential-dev/sdk";

export const d = Differential({
  apiSecret:
    "sk_long_rain_92bacd8a886a76461b0a7ce76e3e10b87352efdf3c118368fe6c232bf97d2a22",
});

export const listen = (machineType: string) => {
  d.listen({
    asMachineTypes: [machineType],
  });
};
