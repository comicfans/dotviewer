import Split from 'split.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import {graphviz} from 'd3-graphviz';
import parse_graph from './dot2graphology';
import parse from 'dotparser';
import Sigma from "sigma";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import random from 'graphology-layout/random';
//import Alpine from 'alpinejs';


Split(['#split-editor', '#split-graph'], {
  sizes: [50, 50],
  minSize: 100,
  gutterSize: 5
})


const localFile= document.getElementById('local-dot');
const contents = document.getElementById('dot-contents');
const message = document.getElementById('message');
const graphDiv = document.getElementById("split-graph");
const graph = graphviz('#graph'); 

var sigma = null;

// Add an event listener


function loadLocalDot(){
const file = localFile.files[0]; // get the first selected file
  if (!file) return;

  const reader = new FileReader();

  // Read file as text
  reader.onload = (e) => {
    contents.value= e.target.result; // file content
    repaint();
  };

  reader.onerror = (e) => {
    output.value= `Error reading file: ${e.target.error}`;
  };

  reader.readAsText(file); // can also use readAsArrayBuffer or readAsDataURL
}

localFile.addEventListener('change', loadLocalDot);

function postprocess_graph(graph){
  const global_group = graph.findNode((node,attributes)=>{return attributes.label == "global-group"});
  if(global_group!=undefined){
    graph.dropNode(global_group);
  }
  random.assign(graph);
  forceAtlas2.assign(graph, {"iterations": 50});

  // scale node size by in+out edge count

  const max_edge = Math.max(...graph.mapNodes((node, attributes)=>{
    return graph.directedEdges(node).length;
  }));

  const min_size = 1;
  const max_size = 10;

  graph.forEachNode((node,attributes)=>{
    attributes.size = (graph.directedEdges(node).length-1) / max_edge * (max_size - min_size) + 1;
  });
}

function repaint(){

  message.value = 'parsing ...';

  //if(document.getElementById("painting-method").value == 'sigma'){
  if(true){

    var ast = parse(contents.value);
    console.assert(ast.length == 1);
    const p = parse_graph(ast[0]);

    postprocess_graph(p.graph);

    if(!sigma){
      sigma = new Sigma(p.graph, document.getElementById("graph"));
    }else{
      sigma.setGraph(p.graph);
    }

    return;
  }



  graph.engine("twopi");
  graph.renderDot(contents.value);
  if(message.value == 'parsing ...'){
    message.value = '';
  }
}

contents.addEventListener('input', repaint);

graph.onerror((error)=>{
  message.value= error;
});


function resizeGraph(){


  const width = graphDiv.clientWidth;
  const height = graphDiv.clientHeight;

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


document.getElementById('painting-method').addEventListener('change', repaint);
 


repaint();

