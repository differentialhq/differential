import { Flow } from "./Flow";
import logo from "../../logo.png";
import Image from "next/image";

export const ServiceMap = (props: {
  services: Array<{ name: string; functions: Array<{ name: string }> }>;
}) => {
  const mainNode = {
    id: "differential",
    data: {
      label: (
        <div>
          <Image src={logo} width={40} height={40} alt={"logo"} />
        </div>
      ),
    },
    // middle
    position: { x: 0, y: 0 },
  };

  const serviceNodesAndEdges = props.services.map((s, i) => {
    const service = {
      id: s.name,
      data: { label: s.name },
      position: { x: 300 * i, y: 100 },
    };

    const functions = s.functions.map((fn, j) => ({
      id: fn.name,
      data: { label: fn.name },
      position: { x: service.position.x, y: 100 * (j + 2) },
    }));

    const edgesFromDifferentialtoService = {
      id: `differential-${s.name}`,
      source: "differential",
      target: s.name,
    };

    const edges = s.functions.map((fn) => ({
      id: `${s.name}-${fn.name}`,
      source: s.name,
      target: fn.name,
    }));

    return {
      nodes: [service, ...functions],
      edges: [edgesFromDifferentialtoService, ...edges],
    };
  });

  return (
    <div style={{ height: 600 }}>
      <Flow
        initialNodes={[
          mainNode,
          ...serviceNodesAndEdges.map((s) => s.nodes).flat(),
        ]}
        initialEdges={serviceNodesAndEdges.map((s) => s.edges).flat()}
      />
    </div>
  );
};
