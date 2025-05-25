class Eye {
    constructor(position = [0, 0, 0], size = 0.1, rotationY = 0) {
      this.position = position;
      this.size = size;
      this.rotationY = rotationY; 
    }
  
    render(parentMatrix = new Matrix4()) {
      const white = [1.0, 1.0, 1.0, 1.0];
      const black = [0.0, 0.0, 0.0, 1.0];
  
      const baseMatrix = new Matrix4(parentMatrix);
      baseMatrix.textureNum = -2;
      baseMatrix.translate(...this.position);
      baseMatrix.rotate(this.rotationY, 0, 1, 0);
  
      // white part of eye
      const whiteEye = new Cube();
      whiteEye.textureNum = -2;
      whiteEye.color = white;
      whiteEye.matrix = new Matrix4(baseMatrix);
      whiteEye.matrix.scale(this.size, this.size, this.size);
      whiteEye.render();
  
      // black part (pupil)
      const pupil = new Cube();
      pupil.textureNum = -2;
      pupil.color = black;
      pupil.matrix = new Matrix4(baseMatrix);
      pupil.matrix.translate(
        this.size * 0.15,
        this.size * 0.15,
        -this.size * 0.1
      );
      pupil.matrix.scale(this.size * 0.7, this.size * 0.7, this.size * 0.3);
      pupil.render();
    }
  }
  