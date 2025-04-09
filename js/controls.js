// UI 设置
function datGui() {
  vars = function () {
    // 基础
    this.play = true;
    this.playSpeed = 4;
    this.boundSize = 40;
    this.boidCamera = false;
    this.reset = () => location.reload();

    // 鱼
    this.boidCount = 400;
    this.reproductionRate = 0.01;
    this.shuffleBoids = () => shuffleBoids();
    this.separation = true;
    this.alignment = true;
    this.cohesion = true;
    this.bounds = true;
    this.random = true;
    this.predatorAvoidance = true;
    this.obstacleAvoidance = true;
    this.towardsObstacle = true;

    this.separationRadius = 2.2;
    this.alignmentRadius = 7;
    this.cohesionRadius = 11;
    this.predatorAvoidanceRadius = 26;

    this.separationScalar = 0.34;
    this.alignmentScalar = 0.08;
    this.cohesionScalar = 0.09;
    this.boundsScalar = 0.01;
    this.randomScalar = 0.09;
    this.predatorAvoidanceScalar = 0.22;
    this.obstacleAvoidanceScalar = 0.26;

    this.ruleScalar = 0.5;
    this.maxSpeed = 3;
    this.randomWavelenScalar = 0.6;
    this.commonReynolds = false;

    // 捕食者(修改默认值时注意：predatorCount须等于selfCount +coopCount)
    this.predatorCount = 1;
    this.selfPredatorCount = 1;
    this.coopPredatorCount = 0;
    this.reproductionRate_p = 0.1;
    this.cooperativeScalar = 0.5;
    this.ruleScalar_p = 0.3;
    this.maxSpeed_p = 3.5;
    this.attackRadius = 34;
    this.attackScalar = 0.5;

    // 障碍
    this.enabled = false;
    this.showMesh = true;
    this.showPlane = false;
    this.planePosition = 20;

    this.resoultion = 15;
    this.avoidRadius = 14;
    this.raisedTo = 4;
    this.generate = () => {
      showLoader(true);
      setTimeout(() => generateAvoidanceField(), 500);
    };

    // 八叉树
    this.useOctree = true;
    this.leafCapacity = 30;
    this.showOctree = false;
    this.useLargestRadius = true;

    // UI
    this.showVectors = false;
    this.vectorLenMultiplier = 60;
    this.showBounds = true;
    this.showAxes = false;
    this.drawTail = false;
    this.removeTail = () => {
      boids.forEach((boid) => {
        boid.tailLine.previous = null;
        boid.tailLine.children = [];
      });
    };
    this.drawNoiseFunction = false;

    this.startRecording = () => capturer.start();
    this.stopRecording = () => {
      capturer.stop();
      capturer.save();
    };
  };
  var chineseNames = {
    //主菜单
    play: "播放",
    playSpeed: "播放速度",
    boidCamera: "鱼类视角",
    boundSize: "个体大小",
    reset: "重置",

    //鱼群
    boidCount: "鱼类个数",
    reproductionRate: "繁衍速度",
    shuffleBoids: "打乱鱼群",
    separation: "分离",
    alignment: "对齐",
    cohesion: "内聚",
    bounds: "边界",
    random: "随机方向",
    predatorAvoidance: "躲避捕食者",
    obstacleAvoidance: "躲避障碍物",
    towardsObstacle: "接近障碍物",
    ruleScalar: "规则标量",
    maxSpeed: "最大速度",
    commonReynolds: "Reynolds算法",

    //捕食者
    selfPredatorCount: "“自私型”个数",
    coopPredatorCount: "“合作型”个数",
    reproductionRate_p: "繁衍速度",
    attackScalar: "攻击意向",
    attackRadius: "攻击半径",
    cooperativeScalar: "合作意向",
    ruleScalar_p: "规则标量",
    maxSpeed_p: "最大速度",

    //障碍物
    enabled: "启用",
    showMesh: "显示网孔",
    showPlane: "显示平面",
    planePosition: "平面位置",
    resoultion: "清晰度",
    avoidRadius: "躲避半径",
    raisedTo: "指数级别",
    generate: "生成",

    // 八叉树
    useOctree: "使用八叉树",
    leafCapacity: "叶节点容积",
    showOctree: "显示八叉树",
    useLargestRadius: "使用最大半径",

    //UI界面
    showVectors: "显示向量",
    vectorLenMultiplier: "矢量长度因子",
    showBounds: "显示边界",
    drawTail: "绘制轨迹",
    removeTail: "移除轨迹",

    startRecording: "开始录制",
    stopRecording: "停止录制",
    drawNoiseFunction: "绘制噪声函数",
    showAxes: "显示轴",
  };
  vars = new vars();
  const mobile = window.innerWidth <= 812 || window.innerHeight <= 400;
  gui = new dat.GUI({ width: mobile ? 248 : 270 });
  if (mobile) gui.close();

  folMain = gui.addFolder("主菜单");
  folBoids = gui.addFolder("鱼群");
  folPredators = gui.addFolder("捕食者");
  folObstacles = gui.addFolder("障碍物");
  folOctree = gui.addFolder("八叉树");
  folUI = gui.addFolder("UI界面");
  if (!mobile) folBoids.open();//若不是在手机端打开，则自动展开boids栏

  // Main目录 ---------------------------------------------------------------
  folMain.add(vars, "play").name(chineseNames.play).listen();
  folMain.add(vars, "playSpeed", 0, 10).name(chineseNames.playSpeed).step(0.1);
  folMain
    .add(vars, "boidCamera")
    .name(chineseNames.boidCamera)
    .listen()
    .onChange((value) => {
      changeCamera(value);
    });
  folMain
    .add(vars, "boundSize", 1, 150)
    .name(chineseNames.boundSize)
    .step(1)
    .onChange((value) => updateBounds(value));
  folMain.add(vars, "reset").name(chineseNames.reset);

  // Boids目录 --------------------------------------------------------------
  folBoids
    .add(vars, "boidCount", 0, boidTotalCount)
    .name(chineseNames.boidCount)
    .step(1)
    .onChange((value) => changeBoidCount(boids, value));

  folBoids.add(vars, "reproductionRate", 0, 0.10).name(chineseNames.reproductionRate).step(0.01);

  folBoids.add(vars, "shuffleBoids").name(chineseNames.shuffleBoids);
  const rules = [
    ["separation", 10],
    ["alignment", 100],
    ["cohesion", 100],
    ["bounds"],
    ["random"],
    ["predatorAvoidance", 100],
    ["obstacleAvoidance"],
  ];

  rules.forEach((rule) => {
    const ruleName = rule[0];
    const chineseRuleName = chineseNames[ruleName];
    folBoids.add(vars, rule[0]).name(chineseRuleName);
  });

  folBoids.add(vars, "towardsObstacle").name(chineseNames.towardsObstacle);

  folWeights = folBoids.addFolder("规则标量");//规则标量
  folDists = folBoids.addFolder("规则半径");//规则半径

  rules.forEach((rule) => {
    const ruleName = rule[0];
    const chineseRuleName = chineseNames[ruleName];
    const chineseRuleScalarName =chineseRuleName + "标量";
    const chineseRuleRadiusName =chineseRuleName + "半径";
    folWeights.add(vars, rule[0] + "Scalar", 0, 0.5).name(chineseRuleScalarName).step(0.01);
    if (rule[1])
      folDists.add(vars, rule[0] + "Radius", 0, rule[1]).name(chineseRuleRadiusName).step(rule[1] / 100);
  });

  folBoidsAdvanced = folBoids.addFolder("高级选项");
  folBoidsAdvanced.add(vars, "ruleScalar", 0, 3).name(chineseNames.ruleScalar).step(0.01);
  folBoidsAdvanced.add(vars, "maxSpeed", 0, 5).name(chineseNames.maxSpeed).step(0.5);
  folBoidsAdvanced.add(vars, "commonReynolds").name(chineseNames.commonReynolds);

  // Predators目录 ----------------------------------------------------------
  folPredators
    .add(vars, "selfPredatorCount", 0, selfishPredatorTotalCount)
    .name(chineseNames.selfPredatorCount)
    .step(1)
    .onChange((value) => change1PredatorCount(predators, value));
  folPredators
    .add(vars, "coopPredatorCount", 0, cooperativePredatorTotalCount)
    .name(chineseNames.coopPredatorCount)
    .step(1)
    .onChange((value) => change2PredatorCount(predators, value));

  //folPredators.add(vars, "reproductionRate_p", 0, 0.5).name(chineseNames.reproductionRate_p).step(0.1);

  folPreatorsAdvanced = folPredators.addFolder("高级选项");
  folPreatorsAdvanced.add(vars, "attackScalar", 0, 0.1).name(chineseNames.attackScalar).step(0.001);
  folPreatorsAdvanced.add(vars, "attackRadius", 0, 100).name(chineseNames.attackRadius).step(1);
  folPreatorsAdvanced.add(vars, "cooperativeScalar", 0, 1).name(chineseNames.cooperativeScalar).step(0.01);
  folPreatorsAdvanced.add(vars, "ruleScalar_p", 0, 3).name(chineseNames.ruleScalar_p).step(0.01);
  folPreatorsAdvanced.add(vars, "maxSpeed_p", 0, 5).name(chineseNames.maxSpeed_p).step(0.5);

  // Obstacles目录 ----------------------------------------------------------
  folObstacles.add(vars, "enabled").name(chineseNames.enabled).onChange(updateObstacles);
  folObstacles.add(vars, "showMesh").name(chineseNames.showMesh).onChange(updateObstacles);
  folObstacles.add(vars, "showPlane").name(chineseNames.showPlane).onChange(updateObstacles);
  folObstacles
    .add(vars, "planePosition", 10, 30)
    .name(chineseNames.planePosition)
    .step(0.1)
    .onChange(() => (plane.changePos = true));

  folObstaclesGenerate = folObstacles.addFolder("生成场域");
  folObstaclesGenerate.add(vars, "resoultion", 3, 25).name(chineseNames.resoultion).step(1);
  folObstaclesGenerate.add(vars, "avoidRadius", 1, 20).name(chineseNames.avoidRadius).step(1);
  folObstaclesGenerate.add(vars, "raisedTo", 1, 5).name(chineseNames.raisedTo).step(0.1);
  folObstaclesGenerate.add(vars, "generate").name(chineseNames.generate);

  // Octree目录-------------------------------------------------------------
  folOctree.add(vars, "useOctree").name(chineseNames.useOctree);
  folOctree.add(vars, "leafCapacity", 1, 100).name(chineseNames.leafCapacity).step(1);
  folOctree.add(vars, "showOctree").name(chineseNames.showOctree);

  folOctreeAdvanced = folOctree.addFolder("高级选项");
  folOctreeAdvanced.add(vars, "useLargestRadius").name(chineseNames.useLargestRadius);

  // UI目录 -----------------------------------------------------------------
  folUI
    .add(vars, "showVectors")
    .name(chineseNames.showVectors)
    .onChange((value) => (subject.helpArrows.visible = value));
  folUI.add(vars, "vectorLenMultiplier", 0, 100).name(chineseNames.vectorLenMultiplier).step(1).onChange(setArrows);
  folUI.add(vars, "showBounds").name(chineseNames.showBounds).onChange((value) => (boundBox.visible = value));
  folUI.add(vars, "drawTail").name(chineseNames.drawTail);
  folUI.add(vars, "removeTail").name(chineseNames.removeTail);

  folUIAdvanced = folUI.addFolder("高级选项");
  folUIAdvanced.add(vars, "startRecording").name(chineseNames.startRecording);
  folUIAdvanced.add(vars, "stopRecording").name(chineseNames.stopRecording);
  //folUIAdvanced.add(vars, "drawNoiseFunction").name(chineseNames.drawNoiseFunction);
  folUIAdvanced
    .add(vars, "showAxes")
    .name(chineseNames.showAxes)
    .onChange((value) => (axesHelper.visible = value));

  return vars;
}

function changeCamera(value) {
  vars.boidCamera = value;
  cameraControls.enabled = !value;
}

function initControls() {
  renderer.domElement.onkeyup = (e) => {
    if (e.keyCode == 32) vars.play = !vars.play;//空格：切换播放状态
    if (e.keyCode == 49) changeCamera(true);//数字1：改变相机视角为鱼的视角
    if (e.keyCode == 50) changeCamera(false);//数字2：改变相机视角为整体视角
  };

  window.addEventListener(
    "mousewheel",
    (e) => {
      if (vars.boidCamera) {
        if (e.deltaY > 0) boidCamera.dist += 0.1;
        else if (e.deltaY < 0 && boidCamera.dist > 0.1) boidCamera.dist -= 0.1;
        if (boidCamera.dist < 0.1) boids[0].visible = false;
        else boids[0].visible = true;

        boidCamera.position.set(0, 0.8 * boidCamera.dist, -2 * boidCamera.dist);

        // side-scroll
        if (e.deltaX < 0) boidCamera.fov += e.deltaX * 0.01;
        else if (e.deltaX > 0) boidCamera.fov += e.deltaX * 0.01;
        if (boidCamera.fov > 160) boidCamera.fov = 160;
        else if (boidCamera.fov < 30) boidCamera.fov = 30;

        boidCamera.updateProjectionMatrix();
      }
    },
    true
  );
}

function changeBoidCount(boidArray, boidCount) {
  for (let i = 0; i < boidArray.length; i++) {
    const boid = boidArray[i];
    if (boidCount > i) boid.visible = true;
    else boid.visible = false;
  }
}
// 添加捕食者
function change1PredatorCount(predatorArray, predatorCount) {
  vars.predatorCount = vars.selfPredatorCount + vars.coopPredatorCount;
  for (let i = 0; i < selfishPredatorTotalCount; i++) {
    const predator = predatorArray[i];
    predator.type = 1;
    if (predatorCount > i) {
      predator.visible = true;
      //console.log("i="+i+"set true");
    }
    else predator.visible = false;
  }
}
function change2PredatorCount(predatorArray, predatorCount) {
  vars.predatorCount = vars.selfPredatorCount + vars.coopPredatorCount;
  for (let i = selfishPredatorTotalCount; i < predatorTotalCount; i++) {
    const predator = predatorArray[i];
    predator.type = 2;
    if (predatorCount > (i - selfishPredatorTotalCount)) {
      predator.visible = true;
      //console.log("i="+i+"set true");
    }
    else predator.visible = false;
  }
}

function shuffleBoids() {
  boids.forEach((boid) => {
    boid.position.set(
      vars.boundSize * rand(),
      vars.boundSize * rand(),
      vars.boundSize * rand()
    );
    const velocity = new THREE.Vector3(
      rand() - 0.5,
      rand() - 0.5,
      rand() - 0.5
    );
    velocity.setLength(vars.maxSpeed * 0.01);
    boid.velocity.copy(velocity);
    updateDirection(velocity, boid);
  });
}

function updateObstacles() {
  const enabled = vars.enabled;
  obstacles.forEach((obstacle) => {
    obstacle.visible = enabled ? vars.showMesh : false;
  });
  plane.visible = enabled ? vars.showPlane : false;

  const controllers = [
    ...folObstacles.__controllers.slice(1),
    ...folObstacles.__folders["生成场域"].__controllers,
  ];
  controllers.forEach((item) => {
    const parentStyle = item.domElement.parentElement.parentElement.style;
    parentStyle.pointerEvents = enabled ? "auto" : "none";
    parentStyle.opacity = enabled ? 1 : 0.82;
  });
}

function updateBounds(size) {
  const ratio = camera.position.length() / boundBox.prevSize;
  camera.position.setLength(ratio * size);
  boundBox.prevSize = size;

  boundBox.scale.set(size, size, size);
  const pos = size / 2 - 0.01;
  boundBox.position.set(pos, pos, pos);

  const target = vars.boundSize / 2;
  cameraControls.target.set(target, target / 1.1, target);
}

function fullscreen() {
  document.documentElement.requestFullscreen();
}
