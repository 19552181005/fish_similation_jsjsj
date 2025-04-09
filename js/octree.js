var octree;
var sceneCubes;

function initOctree() {
  sceneCubes = new THREE.Group();
  scene.add(sceneCubes);

  updateOctree();
}

function updateOctree() {
  sceneCubes.children = [];

  octree = new Octree(-20, -20, -20, vars.boundSize + 40);
  for (let i = 0; i < vars.boidCount; i++) octree.add(boids[i]);
  if (vars.showOctree) octree.show();
}

class Cube {
  constructor(x, y, z, size, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    this.half = size / 2;
    this.color = color;
  }

  show() {
    const rec = new THREE.Mesh(
      new THREE.BoxGeometry(this.size, this.size, this.size)
    );
    rec.position.set(
      this.x + this.half,
      this.y + this.half,
      this.z + this.half
    );

    this.helper = new THREE.BoxHelper(rec, this.color);
    sceneCubes.add(this.helper);
  }
//该方块是否包含该位置，返回bool值
  containsPosition(position) {
    return (
      position.x > this.x &&
      position.x < this.x + this.size &&
      position.y > this.y &&
      position.y < this.y + this.size &&
      position.z > this.z &&
      position.z < this.z + this.size
    );
  }
//该方块是否包含另一方块，返回bool值
  containsCube(other) {
    return (
      this.x < other.x + other.size &&
      this.x < other.x &&
      this.x + this.size > other.x &&
      this.x + this.size > other.x + other.size &&
      this.y < other.y + other.size &&
      this.y < other.y &&
      this.y + this.size > other.y &&
      this.y + this.size > other.y + other.size &&
      this.z < other.z + other.size &&
      this.z < other.z &&
      this.z + this.size > other.z &&
      this.z + this.size > other.z + other.size
    );
  }
//该方块是否与另一方块相交（相邻），返回bool值
  intersects(other) {
    return (
      this.x < other.x + other.size &&
      this.x + this.size > other.x &&
      this.y < other.y + other.size &&
      this.y + this.size > other.y &&
      this.z < other.z + other.size &&
      this.z + this.size > other.z
    );
  }
}

class Octree {
  constructor(x, y, z, size, depth = 0) {
    this.points = [];
    this.children = [];
    this.divided = false;
    this.depth = depth;

    this.cube = new Cube(x, y, z, size, 0xff99ff);
  }

  show() {
    if (!this.divided) this.cube.show();
    else {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].show();
      }
    }
  }

  getPoints(foundPoints) {
    if (!this.divided) {
      foundPoints.push(...this.points);
    } else {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].getPoints(foundPoints);
      }
    }
  }
//将获得的点放入foundPoints传回，range为当前boid的感知范围（cube类型）
  getPointsInRange(foundPoints, range) {
    if (range.containsCube(this.cube)) {//若感知范围包括当前cube,则将cube中点全部添加
      return this.getPoints(foundPoints);
    } else if (range.intersects(this.cube)) {//若感知范围与当前cube相交,则逐个判断点是否在感知范围内，若是则添加
      if (!this.divided) {//为叶子节点
        for (let i = 0; i < this.points.length; i++) {
          const point = this.points[i];
          if (range.containsPosition(point.position)) foundPoints.push(point);
        }
      } else {//若非叶子节点，则递归调用子节点的getPointsInRange函数
        for (let i = 0; i < this.children.length; i++) {
          this.children[i].getPointsInRange(foundPoints, range);
        }
      }
    }
  }
//对当前节点做进一步划分
  subdivide() {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          const oc = new Octree(
            this.cube.x + (i * this.cube.size) / 2,
            this.cube.y + (j * this.cube.size) / 2,
            this.cube.z + (k * this.cube.size) / 2,
            this.cube.size / 2,
            this.depth + 1
          );
          this.children.push(oc);
        }
      }
    }
    for (let i = 0; i < this.points.length; i++) {
      this.addPointToChild(this.points[i]);
    }
    this.divided = true;
    this.points = [];
  }
//将点添加到子节点种
  addPointToChild(point) {
    const x = point.position.x < this.cube.x + this.cube.size / 2 ? 0 : 1;
    const y = point.position.y < this.cube.y + this.cube.size / 2 ? 0 : 1;
    const z = point.position.z < this.cube.z + this.cube.size / 2 ? 0 : 1;
    this.children[x * 4 + y * 2 + z * 1].add(point);
  }
//添加单个点
  add(point) {
    if (!this.cube.containsPosition(point.position)) {
      return false;
    }

    if (this.divided) {//若当前节点并非叶子节点，则将点添加到其子节点中
      this.addPointToChild(point);
    } else if (this.points.length < vars.leafCapacity) {//若点的个数未超过叶节点容积，直接添加
      this.points.push(point);
    } else {//若点的个数超过叶节点容积，则继续划分节点，将点添加到其子节点中
      this.subdivide();
      this.addPointToChild(point);
    }
  }
}
