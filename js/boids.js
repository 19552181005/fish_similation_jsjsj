//为boids数组初始化
function addBoids() {
  //console.log("addBoids");
  const { boundSize } = vars;
  for (let i = 0; i < boidTotalCount; i++) {
    const boid = addBoid([boundSize / 2, boundSize / 2, boundSize / 2], i);
    setBoidColor(boid);
    boids.push(boid);
  }
  shuffleBoids();

  boids[0].subject = true;
  subject = boids[0];

  changeBoidCount(boids, vars.boidCount);
}
// 为predators数组初始化
function addPredators() {
  //console.log("addPredators");
  for (let i = 0; i < predatorTotalCount; i++) {
    const predator = addBoid([0, 0, 0], i);
    predator.predator = true;
    predator.rest = true;
    predator.restStartTime = 0;
    predator.scale.set(2, 2, 2);
    if(i < selfishPredatorTotalCount) predator.type = 1;
    else predator.type = 2;
    predators.push(predator);
  }

  changeBoidCount(predators, vars.predatorCount);
}


function addBoid(position, index) {
  const boid = new THREE.Group();
  boid.index = index;
  boid.ownTime = 0;
  scene.add(boid);

  const mesh = new THREE.Mesh(
    new THREE.ConeBufferGeometry(0.3, 1),
    new THREE.MeshBasicMaterial({ wireframe: true })
  );
  mesh.geometry.rotateX(THREE.Math.degToRad(90));
  boid.mesh = mesh;
  boid.add(mesh);

  boid.velocity = new THREE.Vector3(0, 0, 0);
  boid.acceleration = new THREE.Vector3();
  boid.position.set(...position);
  updateDirection(boid.velocity.clone(), boid);

  // 噪声启动数据(用于随机方向规则)
  boid.noise = {
    x: { cumWavLen: 0, randomValues: [rand(), rand(), rand(), rand()] },
    y: { cumWavLen: 0, randomValues: [rand(), rand(), rand(), rand()] },
    z: { cumWavLen: 0, randomValues: [rand(), rand(), rand(), rand()] },
  };
  

  if (boid.index == 0) {
    // 矢量箭头
    addArrows(boid);

    // 行进路线
    var tailLine = new THREE.Group();
    tailLine.name = "tailLine";
    tailLine.color = 0xff00ff;
    boid.tailLine = tailLine;
    scene.add(tailLine);
  }

  return boid;
}

function moveBoids(delta) {
  if (vars.useOctree) updateOctree();

  const startTime = performance.now();
  for (let i = 0; i < vars.boidCount; i++) {
    const boid = boids[i];
    moveBoid(delta, boid, vars.ruleScalar, vars.maxSpeed);
    setBoidColor(boid);
  }

  // console.log(performance.now() - startTime);
  movingBoidsPanel.update(
    ((performance.now() - startTime) * 1000) / vars.boidCount,
    100
  );

  for (let i = 0; i < predatorTotalCount; i++) {
    const predator = predators[i];
    const t = i-selfishPredatorTotalCount;
    if(i < vars.selfPredatorCount || (t< vars.coopPredatorCount && t >= 0)){
      moveBoid(delta, predator, vars.ruleScalar_p, vars.maxSpeed_p);
      setBoidColor(predator);
    }
  }
}

function moveBoid(delta, boid, ruleScalar, maxSpeed) {
  const { velocity, position } = boid;
  const { playSpeed, drawTail } = vars;

  if (playSpeed == 0 || maxSpeed == 0) return;
  let playDelta = playSpeed * delta * 100;
  if (playDelta > 1000) playDelta = 30;
  boid.ownTime += playDelta * 0.0002;//boid存活时间

  const acceleration = accelerationRules(boid);
  acceleration.multiplyScalar(playDelta * ruleScalar * 0.005);
  acceleration.y *= 0.8; // 减少垂直移动

  velocity.add(acceleration);
  //若为捕食者，则对其适用velocityRules（攻击规则）
  if (boid.predator) {
    velocityRules(boid, playDelta);
  }
  
  velocity.clampLength(0, maxSpeed*0.01);
  const velClone = velocity.clone();
  velClone.multiplyScalar(playDelta);
  position.add(velClone);

  updateDirection(velClone, boid);
  if (boid.subject && drawTail) addLineSegment(boid.tailLine, boid.position);
}
//模拟自然规则，种群中存在消亡，繁殖，那么数量也要有相应的改变
function updateBoidCount(boidArray = boids) {
  const reproductionRate = vars.reproductionRate;
  const aliveCount = updateAliveCount(boidArray);
  currentCount = aliveCount * (1 + reproductionRate * vars.playSpeed * 0.1);
  currentCount = currentCount.toFixed(0);//取整
  if(currentCount != aliveCount){
    vars.boidCount = currentCount;
    changeBoidCount(boids, currentCount);
  }
  //console.log("updateBoidCount,"+currentCount);
  document.getElementById("alive").textContent =
      "存活数量: " + currentCount;
}
//返回当前鱼群存货个数
function updateAliveCount(boidArray) {
  let aliveCount = 0;
  for (let i = 0; i < boidTotalCount; i++) {
    if(boidArray[i].visible) aliveCount++;
  }
  return aliveCount;
}

// 针对捕食者，单独添加到速度中攻击规则
function velocityRules(boid, playDelta) {
  const atk = velocityAttack(boid);
  atk.multiplyScalar(playDelta);
  rules = [{ vec: atk, scalar: vars.attackScalar * 2 }];
  applyRules(rules, boid.velocity);
}

// 添加到加速度中的规则，返回加速度向量
function accelerationRules(boid) {
  const acceleration = new THREE.Vector3();
  let rules;

  if (boid.predator) {//若为捕食者
    const rey = reynolds(boid, predators);
    rules = [
      { vec: reynolds(boid, predators)[0], scalar: vars.separationScalar },
      { vec: bounds(boid), scalar: vars.boundsScalar / 1.5 },
      { vec: random(boid), scalar: vars.randomScalar / 2 },
      {
        vec: obstacleAvoidance(boid),
        scalar: vars.obstacleAvoidanceScalar * 4,
      },
    ];
    //若为合作类型，则令其作为群体进行捕食
    if(boid.type == 2){
      rules.push({ vec: rey[2], scalar: vars.cooperativeScalar /3.7 });//本来是除以4
    }
  } else {//若为鱼，则遵守reynold三个原则+边界+随机+避障
    const rey = reynolds(boid, boids);
    rules = [
      {
        name: "sep",
        vec: rey[0],
        enabled: vars.separation,
        scalar: vars.separationScalar,
      },
      {
        name: "ali",
        vec: rey[1],
        enabled: vars.alignment,
        scalar: vars.alignmentScalar,
      },
      {
        name: "coh",
        vec: rey[2],
        enabled: vars.cohesion,
        scalar: vars.cohesionScalar,
      },
      {
        name: "bnd",
        vec: bounds(boid),
        enabled: vars.bounds,
        scalar: vars.boundsScalar,
      },
      {
        name: "ran",
        vec: random(boid),
        enabled: vars.random,
        scalar: vars.randomScalar,
      },
      {
        name: "pre",
        vec: predatorAvoidance(boid),
        enabled: vars.predatorAvoidance,
        scalar: vars.predatorAvoidanceScalar,
      },
      {
        name: "obs",
        vec: obstacleAvoidance(boid),
        enabled: vars.obstacleAvoidance,
        scalar: vars.obstacleAvoidanceScalar * 2,
      },
      { enabled: vars.towardsObstacle, vec: towards(boid), scalar: 1 },
    ];
  }

  applyRules(rules, acceleration);

  if (boid.subject) {
    setInfo(rules);
    setInfoItem({ name: "acc", enabled: true, vec: acceleration.clone() });
  }

  return acceleration;
}
//将规则逐个加到向量中
function applyRules(rules, vector) {
  for (let i = 0; i < rules.length; i++) {
    const { scalar, vec, enabled } = rules[i];
    if (enabled == false) continue;
    vec.multiplyScalar(scalar);
    vector.add(vec);
  }
}
