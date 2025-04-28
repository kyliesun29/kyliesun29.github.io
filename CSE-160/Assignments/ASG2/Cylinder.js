class Cylinder {
    constructor(segments = 36, color = [1.0, 1.0, 1.0, 1.0]) {
      this.segments = segments;
      this.color = color;
      this.matrix = new Matrix4();
    }
  
    render() {
      gl.uniform4f(u_FragColor, ...this.color);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      let angleStep = 360 / this.segments;
      let vertices = [];
  
      let topCenter = [0, 0.5, 0];
      let bottomCenter = [0, -0.5, 0];
  
      for (let i = 0; i < this.segments; i++) {
        let angle1 = (i * angleStep) * Math.PI / 180;
        let angle2 = ((i + 1) * angleStep) * Math.PI / 180;
  
        let x1 = Math.cos(angle1) * 0.5;
        let z1 = Math.sin(angle1) * 0.5;
        let x2 = Math.cos(angle2) * 0.5;
        let z2 = Math.sin(angle2) * 0.5;
  
        drawTriangle3D([x1, -0.5, z1, x1, 0.5, z1, x2, 0.5, z2]);
        drawTriangle3D([x1, -0.5, z1, x2, 0.5, z2, x2, -0.5, z2]);
        drawTriangle3D([topCenter[0], topCenter[1], topCenter[2], x2, 0.5, z2, x1, 0.5, z1]);
        drawTriangle3D([bottomCenter[0], bottomCenter[1], bottomCenter[2], x1, -0.5, z1, x2, -0.5, z2]);
      }
    }
  }