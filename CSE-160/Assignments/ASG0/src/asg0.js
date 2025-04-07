// DrawTriangle.js (c) 2012 matsuda
function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

  var v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");

}

function handleDrawEvent() {
  // Get canvas and context
  let canvas = document.getElementById('example');
  let ctx = canvas.getContext('2d');

  // Clear canvas and fill it black again
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read values from input fields
  let x1 = parseFloat(document.getElementById("v1xInput").value);
  let y1 = parseFloat(document.getElementById("v1yInput").value);
  let v1 = new Vector3([x1, y1, 0]);

  let x2 = parseFloat(document.getElementById("v2xInput").value);
  let y2 = parseFloat(document.getElementById("v2yInput").value);  
  let v2 = new Vector3([x2, y2, 0]);

  // Draw the vector
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function drawVector(v, color) {
  let canvas = document.getElementById('example');
  let ctx = canvas.getContext('2d');

  let originX = canvas.width / 2;
  let originY = canvas.height / 2;

  let pointendX = originX + v.elements[0] * 20;
  let pointendY = originY - v.elements[1] * 20; 

  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(pointendX, pointendY);
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.stroke();
}


function handleDrawOperationEvent() {
  let canvas = document.getElementById('example');
  let ctx = canvas.getContext('2d');

  // clear to black
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let v1x = parseFloat(document.getElementById("v1xInput").value);
  let v1y = parseFloat(document.getElementById("v1yInput").value);
  let v2x = parseFloat(document.getElementById("v2xInput").value);
  let v2y = parseFloat(document.getElementById("v2yInput").value);


  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  let operation = document.getElementById("operation-choose").value;
  let scalar = parseFloat(document.getElementById("scalar").value);

  if (operation === "add") {
    console.log("hello");
    let v3 = new Vector3(v1.elements);
    v3.add(v2);
    drawVector(v3, "green");

  } else if (operation === "sub") {
    let v3 = new Vector3(v1.elements);
    v3.sub(v2);
    drawVector(v3, "green");

  } else if (operation === "mul") {
    let v3 = new Vector3(v1.elements);
    let v4 = new Vector3(v2.elements);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (operation === "div") {
    let v3 = new Vector3(v1.elements);
    let v4 = new Vector3(v2.elements);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");

  } else if (operation === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());

  } else if (operation == "normalize") {
    let v3 = new Vector3(v1.elements);
    let v4 = new Vector3(v2.elements);
    v3.normalize();
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');

  } else if (operation == "anglebetween") {
    let angle = angleBetween(v1, v2);
    console.log("Angle:", Math.round(angle));
  
  } else if (operation == "area") {
    let area = areaTriangle(v1, v2);
    console.log("Area of the triangle: ", area);

  }
}

function angleBetween(v1, v2) {
  let dotProduct = Vector3.dot(v1, v2);

  // Calculate the magnitudes of the vectors
  let magv1 = v1.magnitude();
  let magv2 = v2.magnitude();

  let cosTheta = dotProduct / (magv1 * magv2);

  // Clamp to avoid NaN due to floating point precision
  let NaN = Math.max(-1, Math.min(1, cosTheta));
  let angleradian = Math.acos(NaN);
  let angledegree = angleradian * (180 / Math.PI);

  return angledegree;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);

  let mag = cross.magnitude();

  let area = mag / 2;
  
  return area;
}