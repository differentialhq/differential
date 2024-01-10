import Dagre from "@dagrejs/dagre";
import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";

import "reactflow/dist/style.css";

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, options) => {
  g.setGraph({ rankdir: options.direction });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => g.setNode(node.id, node));

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id);

      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const LayoutFlow = ({ initialEdges, initialNodes }) => {
  const { fitView } = useReactFlow();
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const layouted = getLayoutedElements(initialNodes, initialEdges, {
    direction: "TB",
  });

  // const onLayout = useCallback(
  //   (direction) => {
  //     const layouted = getLayoutedElements(nodes, edges, { direction });

  //     setNodes([...layouted.nodes]);
  //     setEdges([...layouted.edges]);

  //     window.requestAnimationFrame(() => {
  //       fitView();
  //     });
  //   },
  //   [nodes, edges]
  // );

  // useEffect(() => {
  //   window.requestAnimationFrame(() => {
  //     fitView();
  //   });
  // }, [fitView]);

  window.requestAnimationFrame(() => {
    fitView();
  });

  return (
    <ReactFlow
      nodes={layouted.nodes}
      edges={layouted.edges}
      // onNodesChange={onNodesChange}
      // onEdgesChange={onEdgesChange}
      fitView
    >
      <Panel position="top-right">
        <button onClick={() => onLayout("TB")}>vertical layout</button>
        <button onClick={() => onLayout("LR")}>horizontal layout</button>
      </Panel>
    </ReactFlow>
  );
};

export function Flow2(props) {
  return (
    <ReactFlowProvider>
      <LayoutFlow
        key={JSON.stringify(props)}
        initialNodes={props.initialNodes}
        initialEdges={props.initialEdges}
      ></LayoutFlow>
    </ReactFlowProvider>
  );
}
