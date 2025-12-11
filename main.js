import Split from 'split.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import {bfsFromNode} from 'graphology-traversal/bfs';
import {graphviz} from 'd3-graphviz';
import dot2graphology from './dotutil';
import Sigma from "sigma";
import { EdgeArrowProgram} from "sigma/rendering";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import random from 'graphology-layout/random';
//import Alpine from 'alpinejs';

var iwanthue = require('iwanthue');

Split(['#split-editor', '#split-graph'], {
  sizes: [50, 50],
  minSize: 100,
  gutterSize: 5
})


const localFile= document.getElementById('local-dot');
const contents = document.getElementById('dot-contents');
const message = document.getElementById('message');
const graphDiv = document.getElementById("split-graph");

var graph = null;

var sigma = null;

var highlightState  = {node: null, neighbors: new Set()};

// Add an event listener


function loadLocalDot(){
  const file = localFile.files[0]; // get the first selected file
  if (!file) return;

  const reader = new FileReader();

  // Read file as text
  reader.onload = (e) => {
    contents.value= e.target.result; // file content
    //reset highlight state
    highlightState  = {node: null, neighbors: new Set()};
    repaint();
  };

  reader.onerror = (e) => {
    output.value= `Error reading file: ${e.target.error}`;
  };

  reader.readAsText(file); // can also use readAsArrayBuffer or readAsDataURL
}

localFile.addEventListener('change', loadLocalDot);

function postprocess_graph(graph, old_graph = null){
  //const global_group = graph.findNode((node,attributes)=>{return attributes.label == "global-group"});
  //if(global_group!=undefined){
  //  graph.dropNode(global_group);
  //}

  if(old_graph != null){
    // try to assign x,y from old_graph node with same id 
    graph.forEachNode((node, attributes)=>{
      attributes.x = Math.random();
      attributes.y = Math.random();
      if(old_graph.hasNode(node)){
        const old_attrs = old_graph.getNodeAttributes(node);
        attributes.x = old_attrs?.x ?? attributes.x;
        attributes.y = old_attrs?.y ?? attributes.y;
      }
    });
  }else{
    random.assign(graph);
  }

  // always assign fixed x,y for initial layout

  // TODO, if two graph topologically equal, reuse positions
  forceAtlas2.assign(graph, {"iterations": old_graph?1:50});

// scale node size by in+out edge count

const max_edge = Math.max(...graph.mapNodes((node, attributes)=>{
  return graph.directedEdges(node).length;
}));

const min_size = 3;
const max_size = 20;

graph.forEachNode((node,attributes)=>{
  attributes.size = (graph.directedEdges(node).length-1) / max_edge * (max_size - min_size) + min_size;
});
}

function updateHighlightNeighbor(){
  highlightState.neighbors = new Set();


  if(highlightState.node){
    const dependency_depth = document.getElementById("dependency-depth").valueAsNumber;
    bfsFromNode(sigma.getGraph(), highlightState.node, function(node, attr, depth){
      highlightState.neighbors.add(node);
      return depth >= dependency_depth ;
    });

    const dependent_depth = document.getElementById("dependent-depth").valueAsNumber;
    bfsFromNode(sigma.getGraph(), highlightState.node, function(node, attr, depth){
      highlightState.neighbors.add(node);
      return depth >= dependent_depth ;
    },{mode:"inbound"});
  }
}

function setHighlightNode(node){
  console.assert(sigma!=null);

  if(highlightState.node == node){
    // click same node again, remove hight light

    highlightState.node = null;
    highlightState.neighbors = new Set();
    
    refresh();
    return;
  }

  highlightState.node = node;
  updateHighlightNeighbor();
  refresh();
}

function paint_sigma(){
  const p = dot2graphology(contents.value);

  postprocess_graph(p.graph, sigma?.getGraph());

  if(graph){
    graph.destroy();
    graph = null;
  }

  if(!sigma){
    
    const el = document.querySelector("#graph > svg");
    if(el){
      el.remove();
    }
    sigma = new Sigma(p.graph, document.getElementById("graph"),
                      {
    defaultEdgeType: "arrow",
    edgeProgramClasses: {
      arrow: EdgeArrowProgram,   // <-- This enables arrows in v3
    },
    });

    sigma.setSetting("nodeReducer", (node, data)=>{
      const res = {...data};

      if (highlightState.node == null){
        return res;
      }

      if(highlightState.node != node && !highlightState.neighbors.has(node)){
        res.forceLabel= false;
        res.label = "";
        res.color = "#f6f6f6"
        res.zIndex = -1;
      }
      return res;

    });

    sigma.setSetting("edgeReducer", (edge, data)=>{

      const res = {...data};
      if(highlightState.node == null){
        return res;
      }

      const [from,to] =  sigma.getGraph().extremities(edge);

      if(!highlightState.neighbors.has(from) || !highlightState.neighbors.has(to)){
        res.hidden = true;
        res.zIndex = -1;
      }


      return res;

    });


    sigma.on("clickNode",(node)=>{
      setHighlightNode(node.node);
    })

  }else{
    sigma.setGraph(p.graph);
  }
  refresh();
}

function paint_graphviz(){
  if(sigma){
    console.assert(graph == null);
    sigma.clear();
    sigma.kill();
    sigma = null;
    
  }

  if(!graph){
    graph = graphviz('#graph'); 
  }
  graph.onerror((error)=>{
    message.value= error;
  });

 // graph.engine("twopi");
  graph.renderDot(contents.value);
}


export function repaint(){

  message.value = 'parsing ...';

  const is_sigma = (document.getElementById("painting-method").value == 'sigma');

  if(is_sigma){
    paint_sigma();
  }else{
    paint_graphviz();
  }

  if(message.value == 'parsing ...'){
    message.value = '';
  }
}

contents.addEventListener('input', repaint);

function refresh(){
  if(sigma){
    // Refresh rendering
    sigma.refresh({
      // We don't touch the graph data so we can skip its reindexation
      skipIndexation: true,
    });
  }
}



function resizeGraph(){


  const width = graphDiv.clientWidth;
  const height = graphDiv.clientHeight;

  if(!graph){
    return;
  }

  graph.width(width);
  graph.height(height);

  const svg = graphDiv.querySelector("svg");

  if(!svg){
    return;
  }

  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

}




// Create a ResizeObserver instance
const observer = new ResizeObserver(resizeGraph);

// Start observing the div
observer.observe(graphDiv);


function reHighlight(){
  updateHighlightNeighbor();
  refresh();
}

document.getElementById('painting-method').addEventListener('change', repaint);
document.getElementById('dependency-depth').addEventListener('change', reHighlight);
document.getElementById('dependent-depth').addEventListener('change', reHighlight);


repaint();
