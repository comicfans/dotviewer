var parse = require('dotparser');
import { readFileSync } from 'node:fs';

//const { readFileSync } = await import('node:fs');

var str = readFileSync('/home/comicfans/project/ClickHouse/build/dot.dot', 'utf8');

var ast = parse(str);

console.assert(ast.length== 1);

var children = ast[0].children;





function parse_graph(node){

  const graph = new Graph();

  const attrs = [];

  for(const child of children){

    if (child.type == 'attr_stmt'){
      attrs.push(child);
      continue;
    }

    if(child.type == 'subgraph'){
      const sub_graph = parse_graph(child);
      graph.addNode(sub_graph.id, sub_graph);
      continue;
    }

    if(child.type == 'node_stmt'){
      graph.addNode(child.node_id.id, {"ast": child});
      continue;
    }

    console.assert(child.type == 'edge_stmt');
    graph.addEdge(child.edge_list[0].id, child.edge_list[1].id, {"ast":child});

  }

  return {"id": node.id, "graph":graph, "ast": node};
}


module.exports = {parse_graph};
