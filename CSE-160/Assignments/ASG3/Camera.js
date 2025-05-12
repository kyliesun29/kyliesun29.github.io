class Camera {
  constructor(canvas) {
    this.eye = new Vector3([450, 0, 450]); 
    this.at = new Vector3([0, 0, 0]);    
    this.up = new Vector3([0, 1, 0]);

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(70, canvas.width / canvas.height, 0.1, 1000);
    this.speed = 2;
  }

  forward() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
    this.clampPosition();
  }

  backward() {
    let f = new Vector3(this.eye.elements);
    f.sub(this.at);
    f.normalize();
    f.mul(this.speed);
    this.eye.add(f);
    this.at.add(f);
    this.clampPosition();
  }

  left() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this.clampPosition();
  }

  right() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);
    this.eye.add(s);
    this.at.add(s);
    this.clampPosition();
  }

  upward() {
    let upStep = new Vector3(this.up.elements);
    upStep.mul(this.speed);
    this.eye.add(upStep);
    this.clampPosition();
    this.at.add(upStep);
  }

  downward() {
    let downStep = new Vector3(this.up.elements);
    downStep.mul(this.speed);
    this.eye.sub(downStep);
    this.clampPosition();
    this.at.sub(downStep);
  }

  rotLeft() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let rotMat = new Matrix4().setRotate(3, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    f = rotMat.multiplyVector3(f);
    f.normalize();
    this.at = new Vector3(this.eye.elements);
    this.clampPosition();
    this.at.add(f);
  }

  rotRight() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    let rotMat = new Matrix4().setRotate(-3, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    f = rotMat.multiplyVector3(f);
    f.normalize();
    this.at = new Vector3(this.eye.elements);
    this.clampPosition();
    this.at.add(f);
  }

    mousePan(dX) {
        const sensitivity = 0.3;
        let angle = -dX * sensitivity;

        let forward = new Vector3(this.at.elements);
        forward.sub(this.eye);

        let rotation = new Matrix4();
        rotation.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

        forward = rotation.multiplyVector3(forward);
        forward.normalize();

        this.at.set(this.eye);
        this.at.add(forward);
    }

    mousePitch(dY) {
        const sensitivity = 0.3;
        let angle = -dY * sensitivity;

        let forward = new Vector3(this.at.elements);
        forward.sub(this.eye);

        let right = Vector3.cross(forward, this.up);
        right.normalize();

        let rotation = new Matrix4();
        rotation.setRotate(angle, right.elements[0], right.elements[1], right.elements[2]);

        forward = rotation.multiplyVector3(forward);
        forward.normalize();

        this.at.set(this.eye);
        this.at.add(forward);
    }

    clampPosition() {
        const minY = -0.65; 
        const maxY = 500.0;
        const minXZ = -500.0;
        const maxXZ = 500.0;

        for (let i of [0, 2]) { 
            this.eye.elements[i] = Math.max(minXZ, Math.min(maxXZ, this.eye.elements[i]));
        }
        this.eye.elements[1] = Math.max(minY, Math.min(maxY, this.eye.elements[1]));

        for (let i of [0, 2]) {
            this.at.elements[i] = Math.max(minXZ, Math.min(maxXZ, this.at.elements[i]));
        }
        this.at.elements[1] = Math.max(minY, Math.min(maxY, this.at.elements[1]));
    }

    willCollide(nextEye) {
        let mapX = Math.floor(nextEye.elements[0] + 16);
        let mapZ = Math.floor(nextEye.elements[2] + 16);

        if (
            mapX < 0 || mapX >= g_map.length ||
            mapZ < 0 || mapZ >= g_map[0].length
        ) return false;

        let height = g_map[mapX][mapZ];
        let blockTopY = height * 2.0; 

        return nextEye.elements[1] < blockTopY;
    }



}