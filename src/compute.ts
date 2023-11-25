import debug from "debug";

const log = debug("differential:compute");

const fly = (params: { appName: string; apiSecret: string }) => ({
  start: async () => {
    const nonStartedMachines = await fetch(
      `https://api.machines.dev/v1/apps/${params.appName}/machines`,
      {
        headers: {
          Authorization: `Bearer ${params.apiSecret}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) =>
        res.filter(
          (machine: { id: string; name: string; state: string }) =>
            machine.state !== "started"
        )
      );

    for (const machine of nonStartedMachines) {
      await fetch(
        `https://api.machines.dev/v1/apps/${params.appName}/machines/${machine.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      ).then(() => {
        log(`Started machine ${machine.name} with id ${machine.id}`);
      });
    }
  },
  stop: async () => {
    const startedMachines = await fetch(
      `https://api.machines.dev/v1/apps/${params.appName}/machines`,
      {
        headers: {
          Authorization: `Bearer ${params.apiSecret}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((res) =>
        res.filter(
          (machine: { id: string; name: string; state: string }) =>
            machine.state !== "started"
        )
      );

    for (const machine of startedMachines) {
      await fetch(
        `https://api.machines.dev/v1/apps/${params.appName}/machines/${machine.id}/stop`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${params.apiSecret}`,
            "Content-Type": "application/json",
          },
        }
      ).then(() => {
        log(`Stopped machine ${machine.name} with id ${machine.id}`);
      });
    }
  },
});

export const compute = {
  fly,
};
