import Graph from 'graphology';

export default function parse_graph(node){

  const graph = new Graph();
  graph.setAttribute("attrs", {});
  parse_recursive(graph, node, [])

  return {"id": node.id, "graph":graph, "ast": node};
}

function parse_recursive(graph, node, path_to_root){

  const attrs = [];

  for(const child of node.children){

    if (child.type == 'attr_stmt'){
      attrs.push(child);
      continue;
    }

    if(child.type == 'subgraph'){
      parse_recursive(graph, child, path_to_root.concat([child.id]));
      continue;
    }

    if(child.type == 'node_stmt'){

      const label = (child.attr_list.find(e=>e.id == 'label') ?? {"eq": child.node_id.id}).eq;

      graph.addNode(path_to_root.concat([child.node_id.id]), {"label": label,"ast": child});
      continue;
    }

    console.assert(child.type == 'edge_stmt');
    graph.addEdge(path_to_root.concat([child.edge_list[0].id]), path_to_root.concat([child.edge_list[1].id]), {"ast":child});
  }

  graph.getAttribute("attrs")[path_to_root]=attrs;
}



