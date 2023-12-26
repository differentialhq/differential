import { client } from "@/client/client";
import { auth } from "@clerk/nextjs";

export default async function Clusters() {
  const { getToken } = await auth();

  console.log(await getToken());

  return (
    <section className="flex w-full h-full px-8 mt-8 mb-2 flex-col">
      <h1 className="text-2xl">My Clusters</h1>
      <div className="flex flex-col mt-4">
        <div className="flex flex-row justify-between">
          <h2 className="text-xl">Cluster 1</h2>
          <button className="text-xl">Edit</button>
        </div>
        <div className="flex flex-row justify-between">
          <h2 className="text-xl">Cluster 2</h2>
          <button className="text-xl">Edit</button>
        </div>
        <div className="flex flex-row justify-between">
          <h2 className="text-xl">Cluster 3</h2>
          <button className="text-xl">Edit</button>
        </div>
      </div>
    </section>
  );
}
