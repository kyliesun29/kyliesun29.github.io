// Kylie Sun
// https://kyliesun29.github.io/CSE-160/Assignments/ASG5/three.html

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 5;
controls.rollSpeed = Math.PI / 4;
controls.dragToLook = true;
controls.autoForward = false;

const clock = new THREE.Clock();

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 2, 4);
directionalLight.castShadow = true;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1.2, 100);
pointLight.position.set(5, 10, 5);
pointLight.castShadow = true;
scene.add(pointLight);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);

function makeInstance(geometry, color, x) {
  const material = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, 0.5, 0);
  scene.add(mesh);
  return mesh;
}

const cubes = [
  makeInstance(boxGeo, 0x44aa88,  0),
  makeInstance(boxGeo, 0x8844aa, -2),
  makeInstance(boxGeo, 0xaa8844,  2),
];

const gltfLoader = new GLTFLoader();
gltfLoader.load('./models/car.glb', (gltf) => {
  const car = gltf.scene;
  car.scale.set(0.5, 0.5, 0.5);
  car.position.set(0, 0.5, 10);
  car.rotation.set(0, 6, 0);
  car.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(car);
});

const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
const road = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 1000), material);
road.rotation.y = Math.PI / 8;
road.position.y = 0;
road.rotation.y = -170;
scene.add(road);

const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
for (let i = 0; i < 20; i++) {
  const type = i % 3;
  let geometry;
  let height = 1;
  if (type === 0) {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (type === 1) {
    geometry = new THREE.SphereGeometry(0.5, 32, 32);
  } else {
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  }

  const obstacle = new THREE.Mesh(geometry, obstacleMaterial);
  const laneOffset = (Math.random() - 0.5) * 8;
  const angle = Math.PI / 8;
  const distance = -5 - i * 10;
  const x = Math.cos(angle) * laneOffset - Math.sin(angle) * distance;
  const z = Math.sin(angle) * laneOffset + Math.cos(angle) * distance;
  obstacle.position.set(x, height / 2, z);
  scene.add(obstacle);
}

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./textures/wall.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

const wallMat = new THREE.MeshBasicMaterial({ map: texture });
const wallCube = new THREE.Mesh(boxGeo, wallMat);
wallCube.position.set(4, 0.5, 0);
wallCube.castShadow = true;
wallCube.receiveShadow = true;
scene.add(wallCube);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 16),
  new THREE.MeshPhongMaterial({ color: 0xffff00 })
);
sphere.position.set(5.2, 0.5, 0);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader()
  .setPath('./textures/')
  .load('learner_park_1k.hdr', function(hdrEquirect) {
    hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;

    scene.background = envMap;
    scene.environment = envMap;

    hdrEquirect.dispose();
    pmremGenerator.dispose();
  });

function render() {
  const delta = clock.getDelta();
  controls.update(delta);

  const time = performance.now() * 0.001;
  cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * 0.1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });

  wallCube.rotation.x = time;
  wallCube.rotation.y = time;

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
