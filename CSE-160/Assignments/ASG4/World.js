// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform int u_whichTexture;

  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;

  uniform bool u_lightOn;
  varying vec4 v_VertPos;

  uniform vec3 u_spotlightPos;
  uniform vec3 u_spotlightDir;
  uniform float u_spotlightCutoff;
  uniform bool u_spotlightOn;
  
  uniform vec3 u_lightColorAmbient;
  uniform vec3 u_lightColorDiffuse;
  uniform vec3 u_lightColorSpecular;
  uniform float u_specularCoefficient;

  uniform sampler2D u_Sampler0;  // nightsky.jpg
  uniform sampler2D u_Sampler1;  // redbricks.jpg
  uniform sampler2D u_Sampler2;  // whitebricks.jpg
  uniform sampler2D u_Sampler3;  // blackbricks.jpg
  uniform sampler2D u_Sampler4;  // greybricks.jpg
  uniform sampler2D u_Sampler5;  // brownbricks.jpg
  uniform sampler2D u_Sampler6;  // grass_sqaures.jgp

  void main() {
    vec4 texColor;

    if (u_whichTexture == -3) {
      texColor = vec4((v_Normal+1.0)/2.0, 1.0);  // use normal
    } else if (u_whichTexture == -2) {
      texColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      texColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      texColor = texture2D(u_Sampler0, v_UV); // nightsky
    } else if (u_whichTexture == 1) {
      texColor = texture2D(u_Sampler1, v_UV); // red
    } else if (u_whichTexture == 2) {
      texColor = texture2D(u_Sampler2, v_UV); // white
    } else if (u_whichTexture == 3) {
      texColor = texture2D(u_Sampler3, v_UV); // black
    } else if (u_whichTexture == 4) {
      texColor = texture2D(u_Sampler4, v_UV); // grey
    } else if (u_whichTexture == 5) {
      texColor = texture2D(u_Sampler5, v_UV); // brown
    } else if (u_whichTexture == 6) {
      texColor = texture2D(u_Sampler6, v_UV); // grass_sqaure
    } else {
      texColor = vec4(1.0, 0.2, 0.2, 1.0); // error red color
  }

  // vec3 lightVector = vec3(v_VertPos)-u_lightPos;  // for the Light Falloff Visualization 1/r^2
  vec3 lightVector = u_lightPos-vec3(v_VertPos);     // for the N dot L
  float r = length(lightVector);

  // N dot L
  vec3 L = normalize(lightVector);
  vec3 N = normalize(v_Normal);
  float nDotL = max(dot(N,L), 0.0);

  // Reflection
  vec3 R = reflect(-L, N);

  // Eye
  vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

  vec3 diffuse = vec3(texColor) * nDotL * u_lightColorDiffuse * 0.7;
  vec3 ambient = vec3(texColor) * u_lightColorAmbient * 0.3;
  vec3 specular = pow(max(dot(E, R), 0.0), u_specularCoefficient) * 0.5 * u_lightColorSpecular;

  float spotEffect = 1.0;
  if (u_spotlightOn) {
    vec3 fragToLight = normalize(u_spotlightPos - vec3(v_VertPos));
    float theta = degrees(acos(dot(fragToLight, normalize(-u_spotlightDir))));
    if (theta > u_spotlightCutoff) {
      spotEffect = 0.0;
    }
  }

  if (u_lightOn) {
    if (u_whichTexture > 1 || u_whichTexture == 0) {
      gl_FragColor = vec4((specular + diffuse + ambient) * spotEffect, 1.0);
    } else {
      gl_FragColor = vec4(diffuse + ambient, 1.0);
    }
  } else {
    gl_FragColor = texColor;
  }

}`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_whichTexture;
let u_NormalMatrix;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_lightColorAmbient;
let u_lightColorDiffuse;
let u_lightColorSpecular;

let u_specularCoefficient;

let g_lightColorAmbient = [0.5, 0.5, 0.5];
let g_lightColorDiffuse = [1.0, 1.0, 1.0];
let g_lightColorSpecular = [1.0, 1.0, 1.0];

let u_spotlightPos, u_spotlightDir, u_spotlightCutoff, u_spotlightOn;
let g_spotlightOn = true;
let g_spotlightPos = [0, 3, 0];
let g_spotlightDir = [0, -1, 0];
let g_spotlightCutoff = 30; 



let g_camera;

let g_lastFrameTime = performance.now();
let g_fpsHistory = [];
const FPS_SMOOTHING = 10; 

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

  // // Get the storage location of a_Position
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of a_Position
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
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

  // Get the storage location of u_GlobalRotateMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // get the storage location of u_GlobalRotateMatrix
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  u_spotlightCutoff = gl.getUniformLocation(gl.program, 'u_spotlightCutoff');
  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  // u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  u_lightColorAmbient = gl.getUniformLocation(gl.program, 'u_lightColorAmbient');
  u_lightColorDiffuse = gl.getUniformLocation(gl.program, 'u_lightColorDiffuse');
  u_lightColorSpecular = gl.getUniformLocation(gl.program, 'u_lightColorSpecular');


  u_specularCoefficient = gl.getUniformLocation(gl.program, 'u_specularCoefficient');
  if (!u_specularCoefficient) {
    console.log('Failed to get the storage location of u_specularCoefficient');
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

let g_normalOn = false;
let g_lightPos = [0,1,-2];
let g_lightOn = true;
let g_lightColor = [1.0, 1.0, 1.0]; // default white


// set up actions for HTML UI elements
function addActionsForHtmlUI() {

  document.getElementById('normalOn').onclick = function() {g_normalOn=true};
  document.getElementById('normalOff').onclick = function() {g_normalOn=false};
  document.getElementById('angleSlide').addEventListener('mousemove', function () {g_globalAngle = this.value; renderAllShapes(); });

  document.getElementById('lightslidex').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[0] = this.value/100; renderAllShapes();}});
  document.getElementById('lightslidey').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[1] = this.value/100; renderAllShapes();}});
  document.getElementById('lightslidez').addEventListener('mousemove', function(ev) {if(ev.buttons == 1) { g_lightPos[2] = this.value/100; renderAllShapes();}});
  
  document.getElementById('lightOn').onclick = function() {g_lightOn = true; renderAllShapes();};
  document.getElementById('lightOff').onclick = function() {g_lightOn = false; renderAllShapes();};

  document.getElementById('ambientColorPicker').addEventListener('input', e => {
  const hex = e.target.value.replace(/^#/, '');
  g_lightColorAmbient = [parseInt(hex.substr(0,2), 16)/255, parseInt(hex.substr(2,2), 16)/255, parseInt(hex.substr(4,2), 16)/255];
  renderAllShapes();});

document.getElementById('diffuseColorPicker').addEventListener('input', e => {
  const hex = e.target.value.replace(/^#/, '');
  g_lightColorDiffuse = [parseInt(hex.substr(0,2), 16)/255, parseInt(hex.substr(2,2), 16)/255, parseInt(hex.substr(4,2), 16)/255];
  renderAllShapes();});

document.getElementById('specularColorPicker').addEventListener('input', e => {
  const hex = e.target.value.replace(/^#/, '');
  g_lightColorSpecular = [parseInt(hex.substr(0,2), 16)/255, parseInt(hex.substr(2,2), 16)/255, parseInt(hex.substr(4,2), 16)/255];
  renderAllShapes();});


}

function keydown(ev){
    if(ev.keyCode      == 68){      // d right
        g_camera.right();
    }
    else if(ev.keyCode == 65){      // a left
        g_camera.left();  
    }
    else if(ev.keyCode == 87){      // w forward
        g_camera.forward();
    }
    else if(ev.keyCode == 83){      // s backward
        g_camera.backward();
    }
    else if(ev.keyCode == 69){      // e rotate right
        g_camera.rotRight();
    }
    else if(ev.keyCode == 81){      // q rotate left
        g_camera.rotLeft();         
    }
    else if(ev.keyCode == 88){      // x up
        g_camera.downward();        
    }
    else if(ev.keyCode == 90){      // z down
        g_camera.upward();          
    } 
    
    renderAllShapes();
    //console.log(ev.keyCode);
}


let g_map = new Array(32).fill().map(() => new Array(32).fill(0));


function drawMap() {
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      let height = g_map[x][y];
      for (let h = 0; h < height*2; h++) {
        let cube = new Cube();
        cube.color = [1, 1, 1, 1]; 
        cube.textureNum = Math.floor(Math.random() * 5) + 1;
        cube.matrix.translate(x - 4, -0.75 + h * 0.4, y - 4);
        cube.matrix.scale(0.4, 0.9, 0.4);
        cube.render();
      }
    }
  }
}

function renderAllShapes() {

  // check the time at the start of this function
  var startTime = performance.now();

  // pass the projection matrix
  var projMat = new Matrix4();
  projMat.setPerspective(90, canvas.width/canvas.height, .1, 1000);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  // pass the view matrix
  var viewMat = new Matrix4();

  g_camera.viewMatrix.setLookAt(
  g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
  g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
  g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );

  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);

  // pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // pass the light position to GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // pass the camera position to GLSL
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  // pass the light status
  gl.uniform1i(u_lightOn, g_lightOn);

  // gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform3fv(u_lightColorAmbient, g_lightColorAmbient);
  gl.uniform3fv(u_lightColorDiffuse, g_lightColorDiffuse);
  gl.uniform3fv(u_lightColorSpecular, g_lightColorSpecular);


  gl.uniform3fv(u_spotlightPos, g_spotlightPos);
  gl.uniform3fv(u_spotlightDir, g_spotlightDir);
  gl.uniform1f(u_spotlightCutoff, g_spotlightCutoff);
  gl.uniform1i(u_spotlightOn, g_spotlightOn);

  u_specularCoefficient = gl.getUniformLocation(gl.program, 'u_specularCoefficient');
  gl.uniform1f(u_specularCoefficient, 80.0); 



  // draw the light
  var light = new Cube();
  light.color = [2,2,0,1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1,-0.1,-0.1);
  light.matrix.translate(-0.5,-0.5,-0.5);
  light.render();

  // draw the sphere
  var sphere = new Sphere();
  // sphere.color = [3,3,10,0];
  sphere.textNum = 2;
  if (g_normalOn) sphere.textureNum = -3;
  sphere.matrix.translate(1.0, 0.5, -0.5);
  sphere.render();

  // draw the floor
  let base = new Cube();
  base.color = [0.95, 0.8, 0.95, 1.0];
  base.textureNum = 6;
  if (g_normalOn) base.textureNum = -3;
  base.matrix.translate(0, -0.75, 0);        // Set Y to where the cat stands
  base.matrix.scale(5, 0.1, 5);            // Cover the world floor from -5 to 5
  base.matrix.translate(-0.5, 0, -0.5);      // Center the floor
  base.render();

  // draw the sky
  var sky = new Cube();
  sky.color = [0.8, 0.8, 0.8, 1.0];
  sky.textureNum = -2;
  if (g_normalOn) sky.textureNum = -3;
  sky.matrix.translate(0, 4.25, 0);           // Shift skybox up so it spans [-0.75, 9.25]
  sky.matrix.scale(-5, -5, -5);            // Invert and scale to fit 10x10x10 cube
  sky.matrix.translate(-0.5, 0, -0.5);     // Center the cube
  sky.render();

  
  // time
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), 'performance-display');

  // ----------------------------- CAT -----------------------------
  var fur = [1.0, 0.6549, 0.149, 1.0];
  var darkerFur = [0.9, 0.5, 0.1, 1.0];
  var pink = [1.0, 0.7, 0.75, 1.0]
  var chestColor = [1.0, 0.95, 0.85, 1.0];  
  var tailTipColor = [0.4, 0.2, 0.1, 1.0];  

  gl.uniform1i(u_whichTexture, -2);
  const head = new Cube();
  head.textureNum = -2;
  head.color = fur;
  if (g_normalOn) head.textureNum =-3;
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
  nose.textureNum = -2;
  if (g_normalOn) nose.textureNum =-3;
  nose.matrix = new Matrix4(headMat);
  nose.matrix.translate(-0.3,0.1,0.17);
  nose.matrix.scale(0.6, 0.5, 0.7);
  nose.render();
  const nose2 = new Cube();
  nose2.textureNum = -2;
  if (g_normalOn) nose2.textureNum =-3;
  nose2.color = pink;
  nose2.matrix = new Matrix4(headMat);
  nose2.matrix.translate(-0.4 ,0.38,0.3);
  nose2.matrix.scale(0.2, 0.2, 0.4);
  nose2.render();

  const eyeL = new Eye([-0.02, 0.65, 0.26], 0.25, 90);
  eyeL.textureNum = -2;
  if (g_normalOn) eyeL.textureNum =-3;
  eyeL.render(headMat);
  const eyeR = new Eye([-0.02, 0.65, 0.9], 0.25, 90);
  eyeR.textureNum = -2;
  if (g_normalOn) eyeR.textureNum =-3;
  eyeR.render(headMat);

  const innerEarL = new HalfCone(36, pink); 
  innerEarL.textureNum = -2;
  if (g_normalOn) innerEarL.textureNum =-3;
  innerEarL.matrix = new Matrix4(headMat);
  innerEarL.matrix.translate(0.5, 1, 0.15);
  innerEarL.matrix.scale(0.3, 0.3, 0.3);
  innerEarL.render();
  const outerEarL = new HalfCone(36, fur); 
  outerEarL.textureNum = -2;
  if (g_normalOn) outerEarL.textureNum =-3;
  outerEarL.matrix = new Matrix4(headMat);
  outerEarL.matrix.translate(0.5, 1, 0.1501); 
  outerEarL.matrix.scale(0.3, 0.6, 0.3); 
  outerEarL.render();

  const innerEarR = new HalfCone(36, pink); 
  innerEarR.textureNum = -2;
  if (g_normalOn) innerEarR.textureNum =-3;
  innerEarR.matrix = new Matrix4(headMat);
  innerEarR.matrix.translate(0.5, 1, 0.8);
  innerEarR.matrix.scale(0.3, 0.3, 0.3);
  innerEarR.render();
  const outerEarR = new HalfCone(36, fur); 
  outerEarR.textureNum = -2;
  if (g_normalOn) outerEarR.textureNum =-3;
  outerEarR.matrix = new Matrix4(headMat);
  outerEarR.matrix.translate(0.5, 1, 0.8); 
  outerEarR.matrix.scale(0.3, 0.6, 0.3); 
  outerEarR.render();

  const upperbody = new Cube();
  upperbody.textureNum = -2;
  if (g_normalOn) upperbody.textureNum =-3;
  upperbody.color = fur;
  upperbody.matrix.translate(-0.2, -0.3, 0.03); 
  upperbody.matrix.scale(0.2, 0.2, 0.25);
  upperbody.matrix.translate(0, g_bodyBounce || 0, 0);  
  upperbody.render();
  var upperbodyMat = new Matrix4(upperbody.matrix);
  var upperbodyLegMat = new Matrix4(upperbody.matrix);

  const lowerbody = new Cube();
  lowerbody.textureNum = -2;
  if (g_normalOn) lowerbody.textureNum =-3;
  lowerbody.color = fur;
  lowerbody.matrix = upperbodyMat;
  lowerbody.matrix.translate(1, -0.2, 0.0001);  
  lowerbody.matrix.scale(1.2, 1.2, 1);
  lowerbody.matrix.translate(0, 0.2, -0.0801 );  
  lowerbody.matrix.rotate(-g_lowerbody_angle, 0, 0, 1);  
  lowerbody.matrix.translate(0, -0.1, 0.08);    
  // console.log("lower body angle: ", g_lowerbody_angle);
  lowerbody.render();

  const midbody = new Cube();
  midbody.textureNum = -2;
  if (g_normalOn) midbody.textureNum =-3;
  midbody.color = chestColor;
  lowerbody.matrix = new Matrix4(upperbodyMat);
  midbody.matrix.translate(-0.15, -0.3, 0.035);  
  midbody.matrix.scale(0.25, 0.15, 0.24);
  midbody.matrix.rotate(-g_lowerbody_angle,0,0,1);
  midbody.render();

  const midbody2 = new Cube();
  midbody2.textureNum = -2;
  if (g_normalOn) midbody2.textureNum =-3;
  midbody2.color = darkerFur;
  lowerbody.matrix = new Matrix4(upperbodyMat);
  midbody2.matrix.translate(-0.15, -0.3, 0.04);  
  midbody2.matrix.scale(0.25, 0.1, 0.24);
  midbody2.render();

  const tailScale = [0.2, 0.5, 0.2];

  const tail1 = new Cylinder(48, darkerFur);
  tail1.textureNum = -2;
  if (g_normalOn) tail1.textureNum =-3;
  let tail1Matrix = new Matrix4(lowerbody.matrix);
  tail1Matrix.translate(1, 1, 0.5);            
  tail1Matrix.translate(0, -0.25, 0);          
  tail1Matrix.rotate(-g_tailAngle1, 0, 0, 1);  
  tail1Matrix.translate(0, 0.25, 0);           
  tail1.matrix = new Matrix4(tail1Matrix).scale(...tailScale);
  tail1.render();
 
  const tail2 = new Cylinder(48, darkerFur);
  tail2.textureNum = -2;
  if (g_normalOn) tail2.textureNum =-3;
  let tail2Matrix = new Matrix4(tail1Matrix);  
  tail2Matrix.translate(0, 0.5, 0);            
  tail2Matrix.translate(0, -0.25, 0);          
  tail2Matrix.rotate(-g_tailAngle2, 0, 0, 1);  
  tail2Matrix.translate(0, 0.25, 0);           
  tail2.matrix = new Matrix4(tail2Matrix).scale(...tailScale);
  tail2.render();
  
  const tail3 = new Cylinder(48, tailTipColor);
  tail3.textureNum = -2;
  if (g_normalOn) tail3.textureNum =-3;
  let tail3Matrix = new Matrix4(tail2Matrix);
  tail3Matrix.translate(0, 0.5, 0);
  tail3Matrix.translate(0, -0.25, 0);
  tail3Matrix.rotate(-g_tailAngle3, 0, 0, 1);
  tail3Matrix.translate(0, 0.25, 0);
  tail3.matrix = new Matrix4(tail3Matrix).scale(...tailScale);
  tail3.render();

  const backLeftLeg = new Cube();
  backLeftLeg.textureNum = -2;
  if (g_normalOn) backLeftLeg.textureNum =-3;
  backLeftLeg.color = darkerFur;
  backLeftLeg.matrix = new Matrix4(upperbodyMat);
  backLeftLeg.matrix.translate(0.6, -0.8, 0.025);  
  backLeftLeg.matrix.translate(0, 0.75, 0);     
  backLeftLeg.matrix.rotate(-g_backLeftLegAngle, 0, 0, 1);
  backLeftLeg.matrix.translate(0, -0.75, 0);    
  backLeftLeg.matrix.scale(0.18, 1, 0.18); 
  backLeftLeg.render();

  const backRightLeg = new Cube();
  backRightLeg.textureNum = -2;
  if (g_normalOn) backRightLeg.textureNum =-3;
  backRightLeg.color = darkerFur;
  backRightLeg.matrix = new Matrix4(upperbodyMat);
  backRightLeg.matrix.translate(0.6, -0.8, 0.8);  
  backRightLeg.matrix.translate(0, 0.75, 0);     
  backRightLeg.matrix.rotate(-g_backRightLegAngle, 0, 0, 1);
  backRightLeg.matrix.translate(0, -0.75, 0);    
  backRightLeg.matrix.scale(0.18, 1, 0.18); 
  backRightLeg.render();

  const frontLeftLeg = new Cube();
  frontLeftLeg.textureNum = -2;
  if (g_normalOn) frontLeftLeg.textureNum =-3;
  frontLeftLeg.color = darkerFur;
  frontLeftLeg.matrix = new Matrix4(upperbodyLegMat);
  frontLeftLeg.matrix.translate(0.1, -1.05, 0.8);  
  frontLeftLeg.matrix.translate(0, 0.7, 0);      
  frontLeftLeg.matrix.rotate(-g_frontLeftLegAngle, 0, 0, 1);
  frontLeftLeg.matrix.translate(0, -0.7, 0);    
  frontLeftLeg.matrix.scale(0.2, 1.2, 0.18);      
  frontLeftLeg.render();

  const frontRightLeg = new Cube();
  frontRightLeg.textureNum = -2;
  if (g_normalOn) frontRightLeg.textureNum =-3;
  frontRightLeg.color = darkerFur;
  frontRightLeg.matrix = new Matrix4(upperbodyLegMat);
  frontRightLeg.matrix.translate(0.1, -1.05, 0.025);  
  frontRightLeg.matrix.translate(0, 0.7, 0);
  frontRightLeg.matrix.rotate(-g_frontRightLegAngle, 0, 0, 1);
  frontRightLeg.matrix.translate(0, -0.7, 0);
  frontRightLeg.matrix.scale(0.2, 1.2, 0.18);
  frontRightLeg.render();


}

function generateHills(num = 50) {
  g_hills = [];

  function isOverlapping(x1, z1, sx1, sz1, x2, z2, sx2, sz2) {
    return (
      x1 - sx1 / 2 < x2 + sx2 / 2 &&
      x1 + sx1 / 2 > x2 - sx2 / 2 &&
      z1 - sz1 / 2 < z2 + sz2 / 2 &&
      z1 + sz1 / 2 > z2 - sz2 / 2
    );
  }

  while (g_hills.length < num) {
    let x = Math.random() * 1000 - 500;
    let z = Math.random() * 1000 - 500;

    // skip the center
    if (x * x + z * z < 200 * 200) continue;

    let sx = 20 + Math.random() * 80;
    let sy = 10 + Math.random() * 40;
    let sz = 20 + Math.random() * 80;
    let textureNum = Math.floor(Math.random() * 5) + 1;

    let overlap = false;
    for (let hill of g_hills) {
      if (isOverlapping(x, z, sx, sz, hill.x, hill.z, hill.sx, hill.sz)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      g_hills.push({ x, z, sx, sy, sz, textureNum });
    }
  }
}



let g_textures = [];

const brickTextures = [
  'images/nightsky.jpg',     // 0
  'images/redbricks.jpg',    // 1
  'images/whitebricks.jpg',  // 2
  'images/blackbricks.jpg',  // 3
  'images/greybricks.jpg',   // 4
  'images/brownbricks.jpg',   // 5
  'images/grass_squares.jpg'  // 6
];

function initTextures() {
  for (let i = 0; i < brickTextures.length; i++) {
    let image = new Image();
    image.onload = function () {
      let texture = gl.createTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.activeTexture(gl[`TEXTURE${i}`]); 
      gl.bindTexture(gl.TEXTURE_2D, texture);     
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      let samplerLoc = gl.getUniformLocation(gl.program, `u_Sampler${i}`);
      gl.uniform1i(samplerLoc, i);
    };
    image.src = brickTextures[i];
  }
}


function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); 
  // enable the texture unit0
  gl.activeTexture(gl.TEXTURE0);
  // bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl. RGB, gl.UNSIGNED_BYTE, image);

  // set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log('finished load texture0');
}

function main() {
  // set up canvas and gl variables
  setupWebGL();
  // set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();
  
  g_camera = new Camera(canvas);

  // set up actions for the HTML UI elements
  addActionsForHtmlUI();

  let g_mousePrevX = null;
  let g_mousePrevY = null;

  canvas.onmousedown = (e) => {
    g_mousePrevX = e.clientX;
    g_mousePrevY = e.clientY;
  };

  canvas.onmousemove = (e) => {
    if (e.buttons === 1) {
      let dX = e.clientX - g_mousePrevX;
      let dY = e.clientY - g_mousePrevY;
      g_camera.mousePan(dX);
      g_camera.mousePitch(dY);
      renderAllShapes();
    }
    g_mousePrevX = e.clientX;
    g_mousePrevY = e.clientY;
  };


  document.onkeydown = keydown;

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // render
  //gl.clear(gl.COLOR_BUFFER_BIT);
  renderAllShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime

// called by browser repeatedly whenever its time
function tick() {
  // print some debug info to know we're running
  g_seconds = performance.now()/1000.0-g_startTime;
  // console.log(g_seconds);

  updateCatAnimation(g_seconds)

  updateAnimationAngles();

  // draw everything
  renderAllShapes();

  // tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

// update the angles of everything if currently animated
function updateAnimationAngles() {
  

  g_lightPos[0] = Math.cos(g_seconds);
}

function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}

