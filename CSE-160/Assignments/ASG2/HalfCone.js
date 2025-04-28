class HalfCone {
  constructor(segments = 24, color = [1, 1, 1, 1]) {
    this.color = color;
    this.matrix = new Matrix4();
    this.segments = segments;
  }

  render() {
    const rgba = this.color;
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    const angleStep = 360 / this.segments;
    const radius = 0.5;
    const height = 1.0;

    const centerX = 0;
    const centerY = 0;
    const centerZ = 0;
    const tip = [0, height, 0];

    for (let i = 0; i < this.segments; i++) {
      const angle1 = (angleStep * i) * Math.PI / 180;
      const angle2 = (angleStep * (i + 1)) * Math.PI / 180;

      const x1 = radius * Math.cos(angle1);
      const z1 = radius * Math.sin(angle1);
      const x2 = radius * Math.cos(angle2);
      const z2 = radius * Math.sin(angle2);

      if (x1 >= 0 && x2 >= 0) {
        // Side
        drawTriangle3D([
          tip[0], tip[1], tip[2],
          x1, centerY, z1,
          x2, centerY, z2
        ]);

        // Base
        drawTriangle3D([
          centerX, centerY, centerZ,
          x2, centerY, z2,
          x1, centerY, z1
        ]);
      }
    }
  }
}
