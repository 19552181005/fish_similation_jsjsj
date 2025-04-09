var info = [
  { name: "sep", color: "#e57373", showArr: true, desc: "分离" },
  { name: "ali", color: "#66bb6a", showArr: true, desc: "对齐" },
  { name: "coh", color: "#5d7ada", showArr: true, desc: "内聚" },
  { name: "bnd", color: "#866144", showArr: true, desc: "边界" },
  { name: "ran", color: "#ffb74d", showArr: true, desc: "随机方向" },
  { name: "pre", color: "#8e64bd", showArr: true, desc: "躲避捕食者" },
  { name: "obs", color: "#64c3ec", showArr: true, desc: "躲避障碍物" },
  { name: "acc", color: "#aaaaaa", showArr: true, desc: "加速度" },
];

function addArrows(boid) {
  var helpArrows = new THREE.Group();
  helpArrows.visible = vars.showVectors;
  boid.helpArrows = helpArrows;

  for (let i = 0; i < info.length; i++) {
    const infoItem = info[i];
    const arrow = new THREE.ArrowHelper();
    arrow.setColor(infoItem.color);
    arrow.name = infoItem.name;
    arrow.visible = false;
    helpArrows.add(arrow);
  }

  boid.add(helpArrows);
}

function setArrows() {
  boids[0].helpArrows.children.forEach((arrow) => {
    const { showArr, vec } = findInfoByName(arrow.name);
    if (!showArr || vec == undefined) return;

    if (vec.length() <= 0) arrow.visible = false;
    else {
      arrow.setLength(vec.length() * vars.vectorLenMultiplier, 0.1, 0.1);
      arrow.setDirection(vec.clone().normalize());
      arrow.visible = true;
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  boidCamera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  boidCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function addNoiseCurve() {
  noiseLines = new THREE.Group();

  [0xff6666, 0x66ff66, 0x6666ff].forEach((color) => {
    var line = new THREE.Group();
    line.color = color;
    noiseLines.add(line);
  });

  scene.add(noiseLines);
}

function drawNoise() {
  const lines = noiseLines.children;
  time = subject.ownTime * vars.randomWavelenScalar;

  x = noise(time + 0.0, subject, "x") * 10;
  y = noise(time + 0.1, subject, "y") * 10;
  z = noise(time + 0.2, subject, "z") * 10;

  xAxisPos = time * 100;

  addLineSegment(lines[0], new THREE.Vector3(xAxisPos, x, 0));
  addLineSegment(lines[1], new THREE.Vector3(xAxisPos, y, 0));
  addLineSegment(lines[2], new THREE.Vector3(xAxisPos, z, 0));

  noiseLines.position.x = -xAxisPos - 5;
}

function addBoidCamera() {
  boids[0].mesh.add(boidCamera);
  boidCamera.dist = 1.5;
  boidCamera.fov = 90;
  boidCamera.rotation.set(0, Math.PI, 0);
  boidCamera.position.set(0, 0.8 * boidCamera.dist, -2 * boidCamera.dist);
}

function addLineSegment(line, vector) {
  vector = vector.clone();

  if (!line.previous) {
    line.previous = vector;
    return;
  }

  const lineGeom = new THREE.Geometry();
  lineGeom.vertices.push(line.previous.clone());
  lineGeom.vertices.push(vector);

  const segment = new THREE.Line(
    lineGeom,
    new THREE.LineBasicMaterial({
      color: line.color,
      opacity: 0.7,
      transparent: true,
    })
  );

  line.add(segment);
  line.previous.copy(vector);
}

function addBounds() {
  boundBox = new THREE.Group();

  helper = new THREE.BoxHelper(
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)),
    "#000"
  );
  helper.material.opacity = 0.2;
  helper.material.transparent = true;
  boundBox.add(helper);
  scene.add(boundBox);

  boundBox.visible = vars.showBounds;
  boundBox.prevSize = vars.boundSize;
  updateBounds(vars.boundSize);
}

function setBoidColor(boid) {
  preys = [];
  const aliveTime = 2;
  const dieTime = 2.6;
  if (predators.length != 0)
    for (let i = 0; i < vars.predatorCount; i++) {
      const predator = predators[i];
      if (predator.preyIndex) preys.push(predator.preyIndex);
    }
  let color = "#00f";
  if (boid.predator) {
    let hungryTime = boid.ownTime - boid.restStartTime ;//restStartTime即上一次近进食结束时间
    if(boid.type == 1){//自私型
      //console.log("hungryTime:" + hungryTime);
      if(hungryTime > aliveTime){
        if(hungryTime > dieTime){
          color = "#f33";//红色
          if(hungryTime > (dieTime+0.2)){
            if(boid.visible )  console.log("Time:"+boid.ownTime+", number:"+boid.index+",type:"+boid.type+" die!");
            boid.visible = false;
          } 
        }
        else color = "#aa5";//暗绿色
      }
      else color = "#2a5";//绿色
      /*
      if (boid.rest) color = "#b66";//休息状态：暗红色 #b66
      else color = "#f33";//捕食状态：红色 #f33
      */
    }else{
      if(hungryTime > aliveTime){
        if(hungryTime > dieTime){
          color = "#f33";
          if(hungryTime > (dieTime+0.2)){
            if(boid.visible ) console.log("Time:"+deltaSum+", number:"+boid.index+",type:"+boid.type+" die!");
            boid.visible = false;
          } 
        }
        else color = "#a1d";//暗蓝色
      }
      else color = "#31d";//蓝色
      /*
      if (boid.rest) color = "#aa5";//休息状态：暗绿色
      else color = "#2a5";//捕食状态：绿色
      */
    }
  
  } else {
    if (preys.includes(boid.index)) color = "#790";//若正作为捕食者的捕猎对象
    else if (boid.subject) color = "#f0f";
    else color = "#000";
  }
  boid.mesh.material.color.set(color);
}

function updateDirection(velClone, boid) {
  boid.mesh.lookAt(velClone.add(boid.position));
}

function setInfo(rules) {
  rules.forEach((rule) => {
    if (rule.name) setInfoItem(rule);
  });
}

function setInfoItem(item) {
  findInfoByName(item.name).vec = item.enabled ? item.vec : undefined;
}

function findInfoByName(name) {
  for (let i = 0; i < info.length; i++)
    if (info[i].name == name) return info[i];
}

function initInfoHTML() {
  innerHTML = "";
  info.forEach((item) => {
    innerHTML += `<div class="infoline" id="${item.name}">
    <span class="rect" style="background-color: ${item.color}"></span>
    <span>${item.name}: 
    <span class="tooltip">${item.desc}</span>
    </span>
    <span>-</span>
    <div class="arr"></div>
    </div>`;
  });
  document.getElementById("info").innerHTML += innerHTML;
}

function updateInfo() {
  setArrows();

  for (let i = 0; i < info.length; i++) {
    const infoItem = info[i];
    const infoDiv = document.getElementById(infoItem.name);
    const enabled = infoItem.vec !== undefined;

    let text, length;
    if (enabled) {
      text = infoItem.vec.length().toFixed(2);
      length = infoItem.vec.length() * 200;
    } else {
      text = "-";
      length = 0;
    }

    infoDiv.children[2].textContent = text;
    infoDiv.children[3].style.width = length + "px";
  }
}

function showLoader(show = true) {
  const elem = document.getElementById("loader");
  if (show) {
    elem.style.display = "inline";
  } else {
    elem.style.display = "none";
  }
}
