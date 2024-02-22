import { Navigation } from "./Navigation";

export default function Layout({
  params,
  children,
}: {
  params: { clusterId: string };
  children: React.ReactNode;
}) {
  return (
    <section className="flex w-full h-full px-8 mt-8 mb-2 flex-col">
      <div className="flex flex-col">
        <p className="text-gray-400">Differential Cluster</p>
        <h1 className="text-2xl font-mono">{params.clusterId}</h1>
      </div>
      <Navigation clusterId={params.clusterId} />
      {children}
    </section>
  );
}
