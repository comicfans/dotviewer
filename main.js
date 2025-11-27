import Split from 'split.js'
import 'bootstrap/dist/css/bootstrap.min.css';
import {graphviz} from 'd3-graphviz';

import 'dot2graphology'

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
graph.engine("sfdp") ;

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


function repaint(){
  message.value = '';
  graph.renderDot(contents.value);
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



repaint();
