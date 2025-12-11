import Graph from 'graphology';
import parse from 'dotparser';
var iwanthue = require('iwanthue');

export default function dot2graphology(dot_string){

  var ast = parse(dot_string);
  console.assert(ast.length == 1);
  const node = ast[0];

  const graph = new Graph();
  graph.setAttribute("attrs", {});
  parse_recursive(graph, node, [])

  var node_palette = iwanthue(graph.order);
  for (const [idx, node] of graph.nodes().entries()) {
    graph.setNodeAttribute(node, 'color', node_palette[idx]);
  }

  var edge_palette = iwanthue(graph.size);
  for (const [idx, edge] of graph.edges().entries()) {
    graph.setEdgeAttribute(edge, 'color', edge_palette[idx]);
  }

  return {"id": node.id, "graph":graph, "ast": node};
}

function full_node_id(path_to_root, node_id){
  return path_to_root.concat([node_id]);
}

function parse_recursive(graph, node, path_to_root){

  const attrs = [];

  for(const child of node.children){

    if (child.type == 'attr_stmt'){
      attrs.push(child);
      continue;
    }

    if(child.type == 'subgraph'){
      parse_recursive(graph, child, full_node_id(path_to_root, child.id));
      continue;
    }

    if(child.type == 'node_stmt'){

      const label = (child.attr_list.find(e=>e.id == 'label') ?? {"eq": child.node_id.id}).eq;

      const node_id = full_node_id(path_to_root,child.node_id.id);


      if(graph.hasNode(node_id)){
        // cmake generated dot may contain duplicate node statement (4.3.0 fix it)
        continue;
      }

      graph.addNode(node_id, {"label": label,"ast": child, forceLabel: true});
      continue;
    }

    console.assert(child.type == 'edge_stmt');
    graph.addEdge(full_node_id(path_to_root,child.edge_list[0].id), full_node_id(path_to_root,child.edge_list[1].id),
                  {"ast":child, type:"arrow", size: 3});
  }

  graph.getAttribute("attrs")[path_to_root]=attrs;
}
