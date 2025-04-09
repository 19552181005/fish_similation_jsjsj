function reynolds(boid, flockmates) {
  const sep = new THREE.Vector3();
  const ali = new THREE.Vector3();
  const coh = new THREE.Vector3();
  let sepNeighbours = 0;
  let aliNeighbours = 0;
  let cohNeighbours = 0;
  let flockmateCount = boid.predator ? vars.predatorCount : vars.boidCount;

  if (vars.commonReynolds) {
    for (let i = 0; i < flockmateCount; i++) {
      const flockmate = flockmates[i];
      const difference = boid.position.clone().sub(flockmate.position);
      const dist = difference.length();
      if (boid.index !== flockmate.index) {
        if (dist < vars.separationRadius) {
          sep.add(flockmate.position);
          sepNeighbours++;
        }
        if (dist < vars.alignmentRadius) {
          ali.add(flockmate.velocity);
          aliNeighbours++;
        }
        if (dist < vars.cohesionRadius) {
          coh.add(flockmate.position);
          cohNeighbours++;
        }
      }
    }
  } else if (vars.useOctree && vars.useLargestRadius) {//默认设置为这个，从内聚，分离，对齐半径中选取最大的作为邻居半径
    flockmates = [];
    octree.getPointsInRange(
      flockmates,
      cubeFromBoidRadius(
        boid.position,
        Math.max(
          vars.cohesionRadius,
          vars.alignmentRadius,
          vars.separationRadius
        )
      )
    );

    for (let i = 0; i < flockmates.length; i++) {
      const flockmate = flockmates[i];
      const difference = boid.position.clone().sub(flockmate.position);
      const dist = difference.length();

      if (boid.index !== flockmate.index) {
        if (dist < vars.separationRadius) {
          difference.setLength(1 - dist / vars.separationRadius);
          sep.add(difference);
        }
        if (dist < vars.alignmentRadius) {
          const vel = flockmate.velocity.clone();
          vel.setLength(1 - dist / vars.alignmentRadius);
          ali.add(vel);
        }
        if (dist < vars.cohesionRadius) {
          difference.setLength(1 - dist / vars.cohesionRadius);
          difference.multiplyScalar(-1);
          coh.add(difference);
        }
      }
    }
  } else if (vars.useOctree) {
    flockmates = [];
    octree.getPointsInRange(
      flockmates,
      cubeFromBoidRadius(boid.position, vars.separationRadius)
    );
    for (let i = 0; i < flockmates.length; i++) {
      const flockmate = flockmates[i];
      if (boid.index !== flockmate.index) {
        const difference = boid.position.clone().sub(flockmate.position);
        const dist = difference.length();
        if (dist < vars.separationRadius) {
          difference.setLength(1 - dist / vars.separationRadius);
          sep.add(difference);
        }
      }
    }

    flockmates = [];
    octree.getPointsInRange(
      flockmates,
      cubeFromBoidRadius(boid.position, vars.alignmentRadius)
    );
    for (let i = 0; i < flockmates.length; i++) {
      const flockmate = flockmates[i];
      if (boid.index !== flockmate.index) {
        const dist = boid.position.distanceTo(flockmate.position);
        if (dist < vars.alignmentRadius) {
          const vel = flockmate.velocity.clone();
          vel.setLength(1 - dist / vars.alignmentRadius);
          ali.add(vel);
        }
      }
    }

    flockmates = [];
    octree.getPointsInRange(
      flockmates,
      cubeFromBoidRadius(boid.position, vars.cohesionRadius)
    );
    for (let i = 0; i < flockmates.length; i++) {
      const flockmate = flockmates[i];
      if (boid.index !== flockmate.index) {
        const difference = flockmate.position.clone().sub(boid.position);
        const dist = difference.length();
        if (dist < vars.cohesionRadius) {
          difference.setLength(1 - dist / vars.cohesionRadius);
          coh.add(difference);
        }
      }
    }
  } else {
    for (let i = 0; i < flockmateCount; i++) {
      const flockmate = flockmates[i];
      const difference = boid.position.clone().sub(flockmate.position);
      const dist = difference.length();

      if (boid.index !== flockmate.index) {
        if (dist < vars.separationRadius) {
          difference.setLength(1 - dist / vars.separationRadius);
          sep.add(difference);
        }
        if (dist < vars.alignmentRadius) {
          const vel = flockmate.velocity.clone();
          vel.setLength(1 - dist / vars.alignmentRadius);
          ali.add(vel);
        }
        if (dist < vars.cohesionRadius) {
          difference.setLength(1 - dist / vars.cohesionRadius);
          difference.multiplyScalar(-1);
          coh.add(difference);
        }
      }
    }
  }

  if (vars.commonReynolds) {
    if (sepNeighbours > 0) {
      sep.divideScalar(sepNeighbours);
      positionClone = boid.position.clone();
      sep.copy(positionClone.sub(sep.clone()));
      sep.multiplyScalar(0.22);
    }
    if (aliNeighbours > 0) {
      ali.divideScalar(aliNeighbours);
      ali.multiplyScalar(44);
    }
    if (cohNeighbours > 0) {
      coh.divideScalar(cohNeighbours);
      coh.sub(boid.position);
      coh.multiplyScalar(0.14);
    }
  } else {
    sep.clampLength(0, 1);
    ali.clampLength(0, 1);
    coh.clampLength(0, 1);
  }

  return [sep, ali, coh];
}
//返回一个代表规则作用域的cube
function cubeFromBoidRadius(position, radius) {
  return new Cube(
    position.x - radius,
    position.y - radius,
    position.z - radius,
    radius * 2
  );
}
//躲避捕食者
function predatorAvoidance(boid) {
  const steer = new THREE.Vector3();

  for (let i = 0; i < vars.predatorCount; i++) {
    const predator = predators[i];
    const diff = boid.position.clone().sub(predator.position);

    if (diff.length() < vars.predatorAvoidanceRadius) {
      diff.setLength(1 - dist / vars.predatorAvoidanceRadius);
      steer.add(diff);
    }
  }

  steer.clampLength(0, 1);
  return steer;
}
//控制boid在边界内运动的规则，返回一个向量
function bounds(boid) {
  const minBound = 0;
  const maxBound = vars.boundSize;
  const steer = new THREE.Vector3();
  const { x, y, z } = boid.position;

  if (x < minBound) steer.x = minBound - x;
  else if (x > maxBound) steer.x = maxBound - x;
  if (y < minBound) steer.y = (minBound - y) * 2;
  else if (y > maxBound) steer.y = maxBound - y;
  if (z < minBound) steer.z = minBound - z;
  else if (z > maxBound) steer.z = maxBound - z;

  steer.y *= 2;
  return steer;
}
//控制boid随机的规则，返回一个向量
function random(boid) {
  const time = boid.ownTime * vars.randomWavelenScalar;

  // constants 0.x added to time to offset random points in function
  const steer = new THREE.Vector3(
    noise(time + 0.0, boid, "x"),
    noise(time + 0.1, boid, "y") * 0.2, // 减少垂直移动
    noise(time + 0.2, boid, "z")
  );

  return steer;
}

function noise(time, boid, axis) {
  const wavelen = 0.3;
  const noiseData = boid.noise[axis];

  if (time >= noiseData.cumWavLen) {
    noiseData.cumWavLen += wavelen;
    noiseData.randomValues.shift();
    noiseData.randomValues.push(rand());
  }

  const value = cubicInterpolate(
    noiseData.randomValues,
    (time % wavelen) / wavelen
  );

  return value * 2 - 1;
}

function obstacleAvoidance(boid) {
  const steer = new THREE.Vector3();
  if (vars.enabled) steer.copy(avoidanceFieldValue(boid.position.toArray()));
  return steer;
}

function towards(boid) {
  const steer = new THREE.Vector3(0, 0, 0);
  if (vars.enabled) {
    const center = new THREE.Vector3(19, 15, 18).sub(boid.position);
    // const center = new THREE.Vector3(24, 19, 23).sub(boid.position);
    center.setLength(0.04);
    steer.add(center);
  }
  return steer;
}

// 控制速度的攻击函数
function velocityAttack(predator) {
  const restTime = 0.2;
  const attackTime = 1.4;

  if (predator.rest) {//若处于休息状态，则寻找最近的捕食对象
    if (predator.ownTime - predator.restStartTime > restTime) {//若距离上一次捕食已经过restTime
      predator.rest = false;
      predator.attackStartTime = predator.ownTime;

      // 选择最近的进行捕食
      let closest = 0;
      let closestDist = Infinity;
      //遍历找寻最近的捕食对象，为捕食者设置preyIndex捕食对象索引
      for (let i = 0; i < vars.boidCount; i++) {
        const prey = boids[i];
        const dist = predator.position.distanceTo(prey.position);
        if (dist < closestDist) {
          closest = prey.index;
          closestDist = dist;
        }
      }
      predator.preyIndex = closest;
    }
    return new THREE.Vector3();
  }

  const closest = boids[predator.preyIndex];
  const diff = closest.position.clone().sub(predator.position);


  const speedUpTime = predator.ownTime - predator.attackStartTime;
  
  //若捕食成功（与捕食目标间隔距离小于1），则结束捕食，进入休息状态
  //if (speedUpTime > attackTime || diff.length() < 1) {//若已经为捕食加速了一定时长（attackTime）或捕食成功，则进入休息
  if (diff.length() < 1) {  
    predator.rest = true;
    predator.restStartTime = predator.ownTime;
    boids[predator.preyIndex].visible = false;
    predator.preyIndex = undefined;
  }
  /*index不存在，但要实现被捕食的鱼消灭
  if(diff.length() < 1 && predator.preyIndex != undefined){
    const index = predator.preyIndex;
  } boids[index].visible = false;
*/
  diff.normalize();
  diff.sub(predator.velocity); // 将速度转向正确的方向
  diff.multiplyScalar(Math.pow(speedUpTime, 8)); // 更流畅的攻击
  diff.clampLength(0, 0.01);
  return diff;
}


// 线性同余发生器
const m = 4294967296; // value from codepen.io/Tobsta
const a = 1664525; // value from codepen.io/Tobsta
const c = 1;
var seed = Math.floor(0.1 * m);
function rand() {
  seed = (a * seed + c) % m;
  return seed / m;
}

// 利用Paul Breeuwsma系数进行三次插值
function cubicInterpolate(values, x) {
  const x2 = x * x;
  const a0 =
    -0.5 * values[0] + 1.5 * values[1] - 1.5 * values[2] + 0.5 * values[3];
  const a1 = values[0] - 2.5 * values[1] + 2 * values[2] - 0.5 * values[3];
  const a2 = -0.5 * values[0] + 0.5 * values[2];
  const a3 = values[1];

  return a0 * x * x2 + a1 * x2 + a2 * x + a3;
}
