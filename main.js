import Split from 'split.js'
import 'bootstrap/dist/css/bootstrap.min.css';

Split(['#split-0', '#split-1'], {
  sizes: [50, 50],
  minSize: 100,
  gutterSize: 5
})


const input = document.getElementById('localDot');

input.addEventListener('change', () => {
  const file = input.files[0]; // get the first selected file
  if (!file) return;

  const reader = new FileReader();

  // Read file as text
  reader.onload = (e) => {
    const output = document.getElementById('dotContents');
    output.textContent = e.target.result; // file content
    console.log(e.target.result);
  };

  reader.onerror = (e) => {
    output.textContent = `Error reading file: ${e.target.error}`;
  };

  reader.readAsText(file); // can also use readAsArrayBuffer or readAsDataURL
});
