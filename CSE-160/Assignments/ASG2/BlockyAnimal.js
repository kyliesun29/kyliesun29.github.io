// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let u_GlobalRotateMatrix;

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

    gl.enable(gl.DEPTH_TEST);
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

  // get the storage location of u_modelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // get the storage location of u_globalrotatematrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // set an initial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);


}

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// global variables related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_globalAngle = 0;

// cat head animation
let g_shakeHeadNo = false;
let g_shakeStartTime = 0;

let g_idleHeadNod = true;
let g_shakeTimer = 0;
let g_isShakingHead = true;

let g_catMood = 0;
let g_moodStartTime = 0;
let g_moodActive = false;

// tail animation
let g_tailWag = true;

let g_tailAngle1 = 0;
let g_tailAngle2 = 0;
let g_tailAngle3 = 0;

// mouse control 
let g_cameraAzimuth = 0;
let g_cameraElevation = 0;
let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;


// set up actions for HTML UI elements
function addActionsForHtmlUI() {

  document.getElementById('resetCat').onclick = function() {resetCatPose(); };
  document.getElementById('angleSlide').addEventListener('mousemove', function () {g_globalAngle = this.value; renderAllShapes(); });

  // body
  document.getElementById('lowerbodySlide').addEventListener('input', function () {
    g_lowerbody_angle = Number(this.value);
    renderAllShapes();
  });
  
  document.getElementById('toggleLowerBodySlider').onclick = function () {
    const slider = document.getElementById('lowerbodySlide');
    const isEnabling = slider.disabled; 
  
    slider.disabled = !slider.disabled;
    this.innerText = slider.disabled ? "Enable Lower Body Control" : "Disable Lower Body Control";
  
    if (isEnabling) {
      g_legWalkAnimation = false;
  
      g_backLeftLegAngle = 0;
      g_backRightLegAngle = 0;
      g_frontLeftLegAngle = 0;
      g_frontRightLegAngle = 0;
  
      document.getElementById('backLeftLegSlide').value = 0;
      document.getElementById('backRightLegSlide').value = 0;
      document.getElementById('frontLeftLegSlide').value = 0;
      document.getElementById('frontRightLegSlide').value = 0;
  
      setLegSlidersEnabled(false);
    } else {
      setLegSlidersEnabled(true);
    }
  
    renderAllShapes();
  };
  

  // head
  document.getElementById('headnodYESSlide').addEventListener('mousemove', function() { g_headnodYES_angle = this.value; renderAllShapes(); });
  document.getElementById('headnodNOSlide').addEventListener('mousemove', function() { g_headnodNO_angle = this.value; renderAllShapes(); });
  document.getElementById('headnodCURIOUSSlide').addEventListener('mousemove', function() { g_headnodCURIOUS_angle = this.value; renderAllShapes(); });
  
  document.getElementById('toggleIdleHeadNod').onclick = function() {g_idleHeadNod = !g_idleHeadNod;};


  // tail
  document.getElementById('tail1Slide').addEventListener('mousemove', function() {g_tailAngle1 = this.value; renderAllShapes(); });
  document.getElementById('tail2Slide').addEventListener('mousemove', function() {g_tailAngle2 = this.value; renderAllShapes(); }); 
  document.getElementById('tail3Slide').addEventListener('mousemove', function() {g_tailAngle3 = this.value; renderAllShapes(); });
  
  document.getElementById('toggleTailAnimation').onclick = function() {g_tailWag = !g_tailWag;};

  // leg
  document.getElementById('backLeftLegSlide').addEventListener('input', function () {g_backLeftLegAngle = Number(this.value);renderAllShapes();});
  document.getElementById('backRightLegSlide').addEventListener('input', function () {g_backRightLegAngle = Number(this.value);renderAllShapes();});
  document.getElementById('frontLeftLegSlide').addEventListener('input', function () {g_frontLeftLegAngle = Number(this.value);renderAllShapes();});
  document.getElementById('frontRightLegSlide').addEventListener('input', function () {g_frontRightLegAngle = Number(this.value);renderAllShapes();});
  
  // walk 
  document.getElementById('toggleLegWalk').onclick = function () {g_legWalkAnimation = !g_legWalkAnimation;setLegSlidersEnabled(!g_legWalkAnimation);};
  
  
  // camera slider
  document.getElementById('resetCameraBtn').onclick = function () {
    g_globalAngle = 0;           
    g_cameraAzimuth = 0;         
    g_cameraElevation = 0;       
  
    const angleSlider = document.getElementById('angleSlide');
    if (angleSlider) angleSlider.value = 0;
  
    renderScene();
  };

}

function updateAnimationAngles() {
 
  // shift-click animation rotation
  if (g_moodActive) {
    const t = g_seconds - g_moodStartTime;
    const duration = 2;
    const textEl = document.getElementById("popupText");

    if (t < duration) {
      if (g_catMood === 0) {
        // NO (Y-axis shake)
        g_headnodNO_angle = 25 * Math.sin(t * 10);
        g_headnodYES_angle = 0;
        textEl.innerText = "no.";
        textEl.style.display = "block";
      } else if (g_catMood === 1) {
        // YES (X-axis nod)
        g_headnodYES_angle = 20 * Math.sin(t * 6);
        g_headnodNO_angle = 0;
        textEl.innerText = "...yes?";
        textEl.style.display = "block";
      } else if (g_catMood === 2) {
        // MAYBE (Z-axis tilt or subtle X+Z combo)
        g_headnodYES_angle = 8 * Math.sin(t * 7); 
        g_headnodNO_angle = 6 * Math.sin(t * 5);  
        textEl.innerText = "...maybe? what? i dunno";
        textEl.style.display = "block";
      }
    } else {
      g_headnodNO_angle = 0;
      g_headnodYES_angle = 0;
      textEl.style.display = "none";
      g_moodActive = false;
    }
  } /////////////////////////////////////////////////////////////////////
  
  // tail wag
  if (g_tailWag) {
    g_tailAngle1 = 15 * Math.sin(g_seconds * 2);
    g_tailAngle2 = 10 * Math.sin(g_seconds * 3);
    g_tailAngle3 = 5 * Math.sin(g_seconds * 4);
  } /////////////////////////////////////////////////////////////////////

  // head nod
  if (g_idleHeadNod) {
    if (!g_isShakingHead) {
      // Gentle nod
      g_headnodYES_angle = 3 * Math.sin(g_seconds * 2);
  
      // Occasionally trigger head shake every ~6 seconds
      if (Math.random() < 0.0015) {
        g_isShakingHead = true;
        g_shakeTimer = g_seconds;
      }
    } else {
      // Dog-style shake-off (quick NO motion)
      const t = g_seconds - g_shakeTimer;
      if (t < 1.0) {
        g_headnodNO_angle = 20 * Math.sin(t * 20); // fast shake
      } else {
        g_isShakingHead = false;
        g_headnodNO_angle = 0;
      }
    }
  } /////////////////////////////////////////////////////////////////////
  
  if (g_legWalkAnimation) {
    const amplitude = 20;
    const speed = 2;
  
    g_backLeftLegAngle   = amplitude * Math.sin(g_seconds * speed);
    g_frontRightLegAngle = g_backLeftLegAngle;
    g_backRightLegAngle  = amplitude * Math.sin(g_seconds * speed + Math.PI);
    g_frontLeftLegAngle  = g_backRightLegAngle;
    g_bodyBounce = 0.02 * Math.sin(g_seconds * speed * 2);
  }
  
}


// globals
let g_lowerbody_angle = 0;
let g_headnodYES_angle = 0;
let g_headnodNO_angle = 0;
let g_headnodCURIOUS_angle = 0;

let g_legWalkAnimation = true;
let g_backLeftLegAngle = 0;
let g_backRightLegAngle = 0;
let g_frontLeftLegAngle = 0;
let g_frontRightLegAngle = 0;



// function that handles all the drawing
function renderScene() {

  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);         
  globalRotMat.rotate(g_cameraElevation, 1, 0, 0);     
  globalRotMat.rotate(g_cameraAzimuth, 0, 1, 0);       
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // colors
  var fur = [1.0, 0.6549, 0.149, 1.0];
  var darkerFur = [0.9, 0.5, 0.1, 1.0];
  var pink = [1.0, 0.7, 0.75, 1.0]
  var chestColor = [1.0, 0.95, 0.85, 1.0];  
  var tailTipColor = [0.4, 0.2, 0.1, 1.0];  

  const head = new Cube();
  head.color = fur;
  head.matrix = new Matrix4(); 
  head.matrix.translate(-0.29, -0.1, 0.08);
  head.matrix.translate(0.075, 0.075, 0.075); 
  head.matrix.rotate(g_headnodYES_angle, 0, 0, 1);
  head.matrix.rotate(g_headnodNO_angle, 0, 1, 0); 
  head.matrix.rotate(g_headnodCURIOUS_angle, 1, 0, 0);
  head.matrix.translate(-0.075, -0.075, -0.075); 
  head.matrix.scale(0.15, 0.15, 0.15);
  head.render();
  
  const headMat = new Matrix4(head.matrix);


  const nose = new Cube();
  nose.matrix = new Matrix4(headMat);
  nose.matrix.translate(-0.3,0.1,0.17);
  nose.matrix.scale(0.6, 0.5, 0.7);
  nose.render();

  const nose2 = new Cube();
  nose2.color = pink;
  nose2.matrix = new Matrix4(headMat);
  nose2.matrix.translate(-0.4 ,0.38,0.3);
  nose2.matrix.scale(0.2, 0.2, 0.4);
  nose2.render();


  const eyeL = new Eye([-0.02, 0.65, 0.26], 0.25, 90);
  eyeL.render(headMat);

  const eyeR = new Eye([-0.02, 0.65, 0.9], 0.25, 90);
  eyeR.render(headMat);
  

  const innerEarL = new HalfCone(36, pink); 
  innerEarL.matrix = new Matrix4(headMat);
  innerEarL.matrix.translate(0.5, 1, 0.15);
  innerEarL.matrix.scale(0.3, 0.3, 0.3);
  innerEarL.render();

  const outerEarL = new HalfCone(36, fur); 
  outerEarL.matrix = new Matrix4(headMat);
  outerEarL.matrix.translate(0.5, 1, 0.1501); 
  outerEarL.matrix.scale(0.3, 0.6, 0.3); 
  outerEarL.render();


  const innerEarR = new HalfCone(36, pink); 
  innerEarR.matrix = new Matrix4(headMat);
  innerEarR.matrix.translate(0.5, 1, 0.8);
  innerEarR.matrix.scale(0.3, 0.3, 0.3);
  innerEarR.render();

  const outerEarR = new HalfCone(36, fur); 
  outerEarR.matrix = new Matrix4(headMat);
  outerEarR.matrix.translate(0.5, 1, 0.8); 
  outerEarR.matrix.scale(0.3, 0.6, 0.3); 
  outerEarR.render();


  const upperbody = new Cube();
  upperbody.color = fur;
  upperbody.matrix.translate(-0.2, -0.3, 0.03); 
  upperbody.matrix.scale(0.2, 0.2, 0.25);
  upperbody.matrix.translate(0, g_bodyBounce || 0, 0);  

  upperbody.render();
  var upperbodyMat = new Matrix4(upperbody.matrix);
  var upperbodyLegMat = new Matrix4(upperbody.matrix);


  const lowerbody = new Cube();
  lowerbody.color = fur;
  lowerbody.matrix = upperbodyMat;
  lowerbody.matrix.translate(1, -0.2, 0.0001);  
  lowerbody.matrix.scale(1.2, 1.2, 1);
  lowerbody.matrix.translate(0, 0.2, -0.0801 );  
  lowerbody.matrix.rotate(-g_lowerbody_angle, 0, 0, 1);  
  lowerbody.matrix.translate(0, -0.1, 0.08);    
  console.log("lower body angle: ", g_lowerbody_angle);
  lowerbody.render();


  const midbody = new Cube();
  midbody.color = chestColor;
  lowerbody.matrix = new Matrix4(upperbodyMat);
  midbody.matrix.translate(-0.15, -0.3, 0.035);  
  midbody.matrix.scale(0.25, 0.15, 0.24);
  midbody.matrix.rotate(-g_lowerbody_angle,0,0,1);
  midbody.render();

  const midbody2 = new Cube();
  midbody2.color = darkerFur;
  lowerbody.matrix = new Matrix4(upperbodyMat);
  midbody2.matrix.translate(-0.15, -0.3, 0.04);  
  midbody2.matrix.scale(0.25, 0.1, 0.24);
  midbody2.render();


  const tailScale = [0.2, 0.5, 0.2];

  const tail1 = new Cylinder(48, darkerFur);
  let tail1Matrix = new Matrix4(lowerbody.matrix);
  tail1Matrix.translate(1, 1, 0.5);            
  tail1Matrix.translate(0, -0.25, 0);          
  tail1Matrix.rotate(-g_tailAngle1, 0, 0, 1);  
  tail1Matrix.translate(0, 0.25, 0);           
  tail1.matrix = new Matrix4(tail1Matrix).scale(...tailScale);
  tail1.render();
 
  const tail2 = new Cylinder(48, darkerFur);
  let tail2Matrix = new Matrix4(tail1Matrix);  
  tail2Matrix.translate(0, 0.5, 0);            
  tail2Matrix.translate(0, -0.25, 0);          
  tail2Matrix.rotate(-g_tailAngle2, 0, 0, 1);  
  tail2Matrix.translate(0, 0.25, 0);           
  tail2.matrix = new Matrix4(tail2Matrix).scale(...tailScale);
  tail2.render();
  
  const tail3 = new Cylinder(48, tailTipColor);
  let tail3Matrix = new Matrix4(tail2Matrix);
  tail3Matrix.translate(0, 0.5, 0);
  tail3Matrix.translate(0, -0.25, 0);
  tail3Matrix.rotate(-g_tailAngle3, 0, 0, 1);
  tail3Matrix.translate(0, 0.25, 0);
  tail3.matrix = new Matrix4(tail3Matrix).scale(...tailScale);
  tail3.render();


  const backLeftLeg = new Cube();
  backLeftLeg.color = darkerFur;
  backLeftLeg.matrix = new Matrix4(upperbodyMat);
  backLeftLeg.matrix.translate(0.6, -0.8, 0.025);  
  
  backLeftLeg.matrix.translate(0, 0.75, 0);     
  backLeftLeg.matrix.rotate(-g_backLeftLegAngle, 0, 0, 1);
  backLeftLeg.matrix.translate(0, -0.75, 0);    
  
  backLeftLeg.matrix.scale(0.18, 1, 0.18); 
  backLeftLeg.render();

  const backRightLeg = new Cube();
  backRightLeg.color = darkerFur;
  backRightLeg.matrix = new Matrix4(upperbodyMat);
  backRightLeg.matrix.translate(0.6, -0.8, 0.8);  
  
  backRightLeg.matrix.translate(0, 0.75, 0);     
  backRightLeg.matrix.rotate(-g_backRightLegAngle, 0, 0, 1);
  backRightLeg.matrix.translate(0, -0.75, 0);    
  
  backRightLeg.matrix.scale(0.18, 1, 0.18); 
  backRightLeg.render();

  const frontLeftLeg = new Cube();
  frontLeftLeg.color = darkerFur;
  frontLeftLeg.matrix = new Matrix4(upperbodyLegMat);
  frontLeftLeg.matrix.translate(0.1, -1.05, 0.8);  

  frontLeftLeg.matrix.translate(0, 0.7, 0);      
  frontLeftLeg.matrix.rotate(-g_frontLeftLegAngle, 0, 0, 1);
  frontLeftLeg.matrix.translate(0, -0.7, 0);    

  frontLeftLeg.matrix.scale(0.2, 1.2, 0.18);      
  frontLeftLeg.render();

  const frontRightLeg = new Cube();
  frontRightLeg.color = darkerFur;
  frontRightLeg.matrix = new Matrix4(upperbodyLegMat);
  frontRightLeg.matrix.translate(0.1, -1.05, 0.025);  

  frontRightLeg.matrix.translate(0, 0.7, 0);
  frontRightLeg.matrix.rotate(-g_frontRightLegAngle, 0, 0, 1);
  frontRightLeg.matrix.translate(0, -0.7, 0);

  frontRightLeg.matrix.scale(0.2, 1.2, 0.18);
  frontRightLeg.render();


}

function main() {
  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register mouse event handlers
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) {
      g_catMood = (g_catMood + 1) % 3;
      g_moodStartTime = g_seconds;
      g_moodActive = true;
    } else {
      g_mouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  };
  
  canvas.onmousemove = function(ev) {
    if (g_mouseDown) {
      const deltaX = ev.clientX - g_lastMouseX;
      const deltaY = ev.clientY - g_lastMouseY;
  
      g_cameraAzimuth -= deltaX * 0.5;
      g_cameraElevation -= deltaY * 0.5;
  
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
  
      renderScene(); 
    }
  };
  
  canvas.onmouseup = function(ev) {
    g_mouseDown = false;
  };
  
  canvas.onmouseleave = function(ev) {
    g_mouseDown = false;
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Start animation loop
  requestAnimationFrame(tick);
}


function resetCatPose() {
  // joint 
  g_lowerbody_angle = 0;
  g_headnodNO_angle = 0;
  g_headnodYES_angle = 0;
  g_headnodCURIOUS_angle = 0;

  g_backLeftLegAngle = 0;
  g_backRightLegAngle = 0;
  g_frontLeftLegAngle = 0;
  g_frontRightLegAngle = 0;

  g_tailAngle1 = 0;
  g_tailAngle2 = 0;
  g_tailAngle3 = 0;

  // animations
  g_headNodYesOn = false;
  g_idleHeadNod = false;
  g_legWalkAnimation = false;
  g_tailWag = false;
  g_isShakingHead = false;
  g_moodActive = false;

  // slider reset
  const sliders = [
    ['angleSlide', 0],
    ['lowerbodySlide', 0],
    ['headnodYESSlide', 0],
    ['headnodNOSlide', 0],
    ['headnodCURIOUSSlide', 0],
    ['tail1Slide', 0],
    ['tail2Slide', 0],
    ['tail3Slide', 0],
    ['backLeftLegSlide', 0],
    ['backRightLegSlide', 0],
    ['frontLeftLegSlide', 0],
    ['frontRightLegSlide', 0]
  ];

  sliders.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  renderScene();
}



function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Set up the global camera rotation matrix from azimuth (Y) and elevation (X)
  let globalRotMat = new Matrix4()
    .rotate(g_cameraElevation, 1, 0, 0)
    .rotate(g_cameraAzimuth, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear the canvas (only once)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Check the time at the end of the function and show it on the page
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}


var g_shapesList = [];
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
  const x = ev.clientX, y = ev.clientY;
  const rect = ev.target.getBoundingClientRect();

  const x_in_canvas = x - rect.left;
  const y_in_canvas = rect.bottom - y;

  const x_GL = (x_in_canvas - canvas.width / 2) / (canvas.width / 2);
  const y_GL = (y_in_canvas - canvas.height / 2) / (canvas.height / 2);

  return [x_GL, y_GL];
}


function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

// called by browser repeatedly whenever its time
var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime
function tick() {
  // print some debug info to know we're running
  g_seconds = performance.now()/1000.0-g_startTime;
  console.log(g_seconds);

  // update animation angles
  updateAnimationAngles();

  // draw everything
  // renderAllShapes();
  renderScene();

  // tell the browser to update again when it has time
  requestAnimationFrame(tick);
}


function setLegSlidersEnabled(enabled) {
  document.getElementById('backLeftLegSlide').disabled = !enabled;
  document.getElementById('backRightLegSlide').disabled = !enabled;
  document.getElementById('frontLeftLegSlide').disabled = !enabled;
  document.getElementById('frontRightLegSlide').disabled = !enabled;
}
