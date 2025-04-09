var scene, renderer;
var camera, cameraControls, boidCamera, axesHelper, subject, bounds, noiseLines;

var clock, capturer, stats, movingBoidsPanel;
//selfishPredatorTotalCount + cooperativePredatorTotalCount 必须等于predatorTotalCount
const boids = [];
const predators = [];
const boidTotalCount = 800;//可设定的鱼群最大值
const predatorTotalCount = 20;
const selfishPredatorTotalCount = 10;//可设定的该类型捕食者最大值
const cooperativePredatorTotalCount = 10;
let deltaSum = 0;
let currentCount = 0;

function init() {
  clock = new THREE.Clock();
  capturer = new CCapture({ framerate: 24, format: "webm" });//每秒24帧
  stats = new Stats();
  movingBoidsPanel = stats.addPanel(new Stats.Panel("μ", "#ff8", "#212"));//每个boid平均处理时间
  stats.showPanel(0);

  let w = window.innerWidth;
  let h = window.innerHeight;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor("#fff");
  renderer.setSize(w, h);

  const container = document.getElementById("container");
  container.appendChild(renderer.domElement);
  container.appendChild(stats.domElement);
  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("fullscreenchange", onWindowResize, false);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, w / h, 1, 1000);
  boidCamera = new THREE.PerspectiveCamera(90, w / h, 0.1, 1000);
  scene.add(camera);

  const b = vars.boundSize;
  camera.position.set(b * 1.45, b * 0.7, b * 3.3);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.rotateSpeed = 0.3;
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 1;
  cameraControls.enabled = !vars.boidCamera;

  axesHelper = new THREE.AxesHelper(vars.boundSize * 0.8);
  axesHelper.visible = vars.showAxes;
  scene.add(axesHelper);
  let currentCount = vars.boidCount;
  document.getElementById("alive").textContent =
      "存活数量: " + currentCount.toFixed(0);

  initControls();
  addBoids();
  addBoidCamera();
  addPredators();
  addBounds();
  addNoiseCurve();
  initInfoHTML();
  initOctree();

  updateInfo();

  let interval = 10000; // 毫秒数
  setInterval(updateBoidCount, interval);
  // 将动画函数传递给addObstacles以等待导入
  addObstacles(animate);
}

function animate() {
  let delta = clock.getDelta();//自上一帧渲染以来经过的时间
  if (delta > 1) delta = 0; // 当标签页有一段时间没有打开

  if (delta && vars.play) {
    deltaSum += delta;
    document.getElementById("time").textContent =
      "运行时间: " + deltaSum.toFixed(1);//运行时间保留一位小数
  
    moveBoids(delta);
    if (vars.drawNoiseFunction) drawNoise(delta);
  }
  updateInfo();
  if (plane.changePos) updatePlaneTexture();

  requestAnimationFrame(animate);
  render();
  stats.update();
}
function render() {
  cameraControls.update();

  if (vars.boidCamera) renderer.render(scene, boidCamera);
  else renderer.render(scene, camera);

  capturer.capture(renderer.domElement);
}
