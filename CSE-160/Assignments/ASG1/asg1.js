// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
    // retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // get the storage location of u_FragColor
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }


}

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// global variables related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegment = 10;


function addActionsForHtmlUI() {

  // clear button
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };

  // shape buttons
  document.getElementById('pointButton').onclick = function() {selectShape(POINT, 'pointButton');};
  document.getElementById('triButton').onclick = function() {selectShape(TRIANGLE, 'triButton');};
  document.getElementById('circleButton').onclick = function() {selectShape(CIRCLE, 'circleButton');};

  // color sliders
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value / 100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value / 100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value / 100;});

  // size slider
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value;});

  // segment slider
  document.getElementById('segmentSlide').addEventListener('mouseup', function() {g_selectedSegment = this.value;});

  // draw picture
  document.getElementById('drawPictureButton').onclick = function() {drawPicture();};
  
  // fill canvas
  document.getElementById('fillCanvasButton').onclick = function () {
    const r = document.getElementById("redSlide").value / 100;
    const g = document.getElementById("greenSlide").value / 100;
    const b = document.getElementById("blueSlide").value / 100;
    
    gl.clearColor(r, g, b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };
  
}

function selectShape(shapeType, buttonId) {
  g_selectedType = shapeType;

  // Remove highlight from all shape buttons
  ['pointButton', 'triButton', 'circleButton'].forEach(id => {
    document.getElementById(id).classList.remove('selected');
  });

  // Highlight the selected shape button
  document.getElementById(buttonId).classList.add('selected');
}

function selectShape(shapeType, buttonId) {
  g_selectedType = shapeType;

  // Remove highlight from all shape buttons
  const buttons = ['pointButton', 'triButton', 'circleButton'];
  for (let id of buttons) {
    document.getElementById(id).classList.remove('active-shape');
  }

  // Highlight the selected button
  document.getElementById(buttonId).classList.add('active-shape');
}



function main() {

  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  //set yp actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  // canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}



var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes =  [];  // the array to store the size of a point

function click(ev) {

  // extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  // create and store the new point
  let point;
  if (g_selectedType == POINT) {
    point = new Point();

  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();

  } else {
    point = new Circle();
    point.segments = g_selectedSegment;
  }

  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // draw every shape that is supposed to be in the canvas
  renderAllShapes();
  
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}


function renderAllShapes() {

  // check the time at the start of this function
  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw each shape in the list
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  // check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");

}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }

  htmlElm.innerHTML = text;
}




////////////////////////////////////////


// converts the canvas to a 0,0 to 400,400 board
function pixelToGL(x, y) {
  return [(x / 400) * 2 - 1, -((y / 400) * 2 - 1)];
}

function drawTrianglePixels(p1, p2, p3, color) {
  let [x1, y1] = pixelToGL(p1[0], p1[1]);
  let [x2, y2] = pixelToGL(p2[0], p2[1]);
  let [x3, y3] = pixelToGL(p3[0], p3[1]);

  const vertices = [x1, y1, x2, y2, x3, y3];

  // buffer
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  // set color
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], 1.0);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function hexToRGB(hex) {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');

  // Parse short format (#abc)
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  const bigint = parseInt(hex, 16);
  return [((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255,];
}


function drawSquarePixels(topLeft, hexColor, scale = 1) {
  const [x, y] = topLeft;
  const baseSize = 20;
  const size = baseSize * scale;
  const color = hexToRGB(hexColor);

  drawTrianglePixels([x, y], [x, y + size], [x + size, y + size], color);
  drawTrianglePixels([x, y], [x + size, y + size], [x + size, y], color);
}


function fillBackground(hexColor) {
  for (let y = 0; y < 400; y += 20) {
    for (let x = 0; x < 400; x += 20) {
      drawSquarePixels([x, y], hexColor, 1);

    }
  }
}


function drawCorgi() {
  
  // left ear
  drawTrianglePixels([100, 0], [60, 80], [100, 80], hexToRGB("#D5873C"));
  drawTrianglePixels([100, 0], [80, 40], [100, 40], hexToRGB("#D5873C"));
  drawTrianglePixels([120, 0], [120, 80], [160, 80], hexToRGB("#D5873C"));
  drawSquarePixels([100,0], "#D5873C", 1);
  drawSquarePixels([100,20], "#D5873C", 1);
  drawSquarePixels([100,40], "#D5873C", 1);
  drawSquarePixels([100,60], "#D5873C", 1);
  drawTrianglePixels([110, 30], [80, 80], [140, 80], hexToRGB("#E8D1AE"));

  // left head
  drawSquarePixels([60, 80], "D5873C", 5);
  drawTrianglePixels([160, 80], [160, 100], [180,100], hexToRGB("#D5873C"));
  drawSquarePixels([160,100], "D5873C", 1);
  drawSquarePixels([160,120], "D5873C", 1);
  drawSquarePixels([160,140], "D5873C", 1);
  drawSquarePixels([160,160], "D5873C", 1);
  drawSquarePixels([60,160], "D5873C", 1);
  drawSquarePixels([60,180], "D5873C", 1);
  drawTrianglePixels([60,200],[120,200],[120,260], hexToRGB("D5873C"));
  drawSquarePixels([80,220], "D5873C", 2);
  drawTrianglePixels([120,240], [100,260], [140,260], hexToRGB("#E8D1AE"));
  drawTrianglePixels([160,80], [180,80],[180,100], hexToRGB("#E8D1AE"));

  // left head * left neck light brown
  drawSquarePixels([180,80] ,"E8D1AE", 1);
  drawSquarePixels([180,100] ,"E8D1AE", 1);
  drawSquarePixels([180,120] ,"E8D1AE", 1);
  drawSquarePixels([180,140] ,"E8D1AE", 1);
  drawSquarePixels([180,160] ,"E8D1AE", 1);
  drawSquarePixels([80,160] ,"E8D1AE", 2);
  drawSquarePixels([120,160] ,"E8D1AE", 2);
  drawSquarePixels([160,160] ,"E8D1AE", 2);
  drawSquarePixels([140,200] ,"E8D1AE", 3);
  drawTrianglePixels([80,200], [140,200],[140,260], hexToRGB("E8D1AE"));

  drawTrianglePixels([80, 260], [40,300], [80,300], hexToRGB("#D5873C"));
  drawSquarePixels([40,300], "D5873C", 2);
  drawSquarePixels([40,340], "D5873C", 2);
  drawSquarePixels([40,360], "D5873C", 2);
  drawSquarePixels([80,360], "D5873C", 2);
  drawSquarePixels([80,260], "D5873C", 1);
  drawTrianglePixels([120,240], [120, 280], [80,280], hexToRGB("E8D1AE"));
  drawTrianglePixels([120,360], [120, 400], [80,360], hexToRGB("E8D1AE"));
  drawSquarePixels([120,260], "E8D1AE", 4);
  drawSquarePixels([80,280], "E8D1AE", 4);
  drawSquarePixels([120,320], "E8D1AE", 4);


  // right ear
  drawTrianglePixels([300, 0], [340, 80], [300, 80], hexToRGB("#D5873C"));
  drawTrianglePixels([300, 0], [320, 40], [300, 40], hexToRGB("#D5873C"));
  drawTrianglePixels([280, 0], [280, 80], [240, 80], hexToRGB("#D5873C"));
  drawSquarePixels([280, 0], "#D5873C", 1);
  drawSquarePixels([280, 20], "#D5873C", 1);
  drawSquarePixels([280, 40], "#D5873C", 1);
  drawSquarePixels([280, 60], "#D5873C", 1);
  drawTrianglePixels([290, 30], [320, 80], [260, 80], hexToRGB("#E8D1AE"));

  // right head
  drawSquarePixels([240, 80], "D5873C", 5);
  drawTrianglePixels([240, 80], [240, 100], [220, 100], hexToRGB("#D5873C"));
  drawSquarePixels([240, 100], "D5873C", 1);
  drawSquarePixels([240, 120], "D5873C", 1);
  drawSquarePixels([240, 140], "D5873C", 1);
  drawSquarePixels([240, 160], "D5873C", 1);
  drawSquarePixels([320, 160], "D5873C", 1);
  drawSquarePixels([320, 180], "D5873C", 1);
  drawTrianglePixels([340, 200], [280, 200], [280, 260], hexToRGB("D5873C"));
  drawSquarePixels([280, 220], "D5873C", 2);
  drawTrianglePixels([280, 240], [300, 260], [260, 260], hexToRGB("#E8D1AE"));
  drawTrianglePixels([240, 80], [220, 80], [220, 100], hexToRGB("#E8D1AE"));

  // right neck light brown
  drawSquarePixels([200, 80], "E8D1AE", 1);
  drawSquarePixels([200, 100], "E8D1AE", 1);
  drawSquarePixels([200, 120], "E8D1AE", 1);
  drawSquarePixels([200, 140], "E8D1AE", 1);
  drawSquarePixels([200, 160], "E8D1AE", 1);
  drawSquarePixels([280, 160], "E8D1AE", 2);
  drawSquarePixels([200, 160], "E8D1AE", 2);
  drawSquarePixels([200, 160], "E8D1AE", 2);
  drawSquarePixels([200, 200], "E8D1AE", 3);
  drawSquarePixels([240,160], "E8D1AE", 2);
  drawTrianglePixels([220, 80], [240, 80], [220, 100], hexToRGB("E8D1AE"));
  drawSquarePixels([220,100], "D5873C");
  drawSquarePixels([220,120], "D5873C");
  drawSquarePixels([220,140], "D5873C");
  drawTrianglePixels([260, 200], [320, 200], [260, 260], hexToRGB("E8D1AE"));

  drawTrianglePixels([320, 260], [360, 300], [320, 300], hexToRGB("#D5873C"));
  drawSquarePixels([320, 300], "D5873C", 2);
  drawSquarePixels([320, 340], "D5873C", 2);
  drawSquarePixels([320, 360], "D5873C", 2);
  drawSquarePixels([300, 360], "D5873C", 2);
  drawSquarePixels([300, 260], "D5873C", 1);
  drawTrianglePixels([280, 240], [280, 280], [320, 280], hexToRGB("E8D1AE"));
  drawTrianglePixels([280, 360], [280, 400], [320, 360], hexToRGB("E8D1AE"));
  drawSquarePixels([200, 260], "E8D1AE", 4);
  drawSquarePixels([200, 280], "E8D1AE", 4);
  drawSquarePixels([200, 320], "E8D1AE", 4);
  drawSquarePixels([280, 280], "E8D1AE", 2);
  drawSquarePixels([280, 320], "E8D1AE", 2);
  drawTrianglePixels([300, 380], [300,400], [280,400], hexToRGB("D5873C"));

  // right blush
  drawSquarePixels([260, 160], "ED7B6D", 1);
  drawTrianglePixels([260, 160], [260, 180], [240, 160], hexToRGB("ED7B6D"));

  // left blush
  drawSquarePixels([120, 160], "ED7B6D", 1);
  drawTrianglePixels([140,160], [140,180], [160,160], hexToRGB("ED7B6D"));

  // left eye 
  drawTrianglePixels([150,150], [160,160], [140,160], hexToRGB("3F140F"));
  drawTrianglePixels([150,170], [160,160], [140,160], hexToRGB("3F140F"));

  // right eye
  drawTrianglePixels([250,150], [240,160], [260,160], hexToRGB("3F140F"));
  drawTrianglePixels([250,170], [240,160], [260,160], hexToRGB("3F140F"));

  // nose
  drawTrianglePixels([190,190],[210,190],[200,210], hexToRGB("3F140F"));

  // smile
  drawTrianglePixels([160,200], [160,220], [180,220], hexToRGB("3F140F"));
  drawTrianglePixels([160,220], [180,230], [200,220], hexToRGB("3F140F"));
  drawTrianglePixels([200,200], [220,220], [180,220], hexToRGB("3F140F"));
  drawTrianglePixels([240,200], [240,220], [220,220], hexToRGB("3F140F"));
  drawTrianglePixels([200,220], [240,220], [220,230], hexToRGB("3F140F"));

}

function drawPicture() {
  
  // clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT);

  // draw background
  fillBackground("E773A5");

  // draw corgi
  drawCorgi();

}