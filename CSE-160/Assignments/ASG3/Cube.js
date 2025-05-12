class Cube {
    constructor() {
        this.type = 'circle';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = 0;
    }

    render() {
        var rgba = this.color;
        
        // pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
        // pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // front of cube
        drawTriangle3DUV([0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0], [0,0, 0,1, 1,1]);

        // back of cube
        drawTriangle3DUV([0.0, 0.0, 1.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0.0, 0.0, 1.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0]-.20, rgba[1]-.20, rgba[2]-.20, rgba[3]);

        // top of cube
        drawTriangle3DUV([0.0, 1.0, 0.0,  1.0, 1.0, 1.0,  1.0, 1.0, 0.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0], [0,0, 0,1, 1,1]);

        // bottom of cube
        drawTriangle3DUV([0.0, 0.0, 0.0,  1.0, 0.0, 1.0,  1.0, 0.0, 0.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0]-.10, rgba[1]-.10, rgba[2]-.10, rgba[3]);

        // left of cube
        drawTriangle3DUV([0.0, 0.0, 0.0,  0.0, 1.0, 1.0,  0.0, 0.0, 1.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 1.0], [0,0, 0,1, 1,1]);

        // right of cube
        drawTriangle3DUV([1.0, 0.0, 0.0,  1.0, 1.0, 1.0,  1.0, 0.0, 1.0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      
    }

    renderfast() {
        var rgba = this.color;

        // Pass color and matrix
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var allverts = [];

        // Front of cube
        allverts = allverts.concat([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        allverts = allverts.concat([0, 0, 0, 0, 1, 0, 1, 1, 0]);

        // Top of cube
        allverts = allverts.concat([0, 1, 0, 1, 1, 1, 1, 1, 0]);
        allverts = allverts.concat([0, 1, 0, 0, 1, 1, 1, 1, 1]);

        // Right of cube
        allverts = allverts.concat([1, 0, 0, 1, 1, 1, 1, 0, 1]);
        allverts = allverts.concat([1, 0, 0, 1, 1, 0, 1, 1, 1]);

        // Left of cube
        allverts = allverts.concat([0, 0, 0, 0, 1, 1, 0, 0, 1]);
        allverts = allverts.concat([0, 0, 0, 0, 1, 0, 0, 1, 1]);

        // Bottom of cube
        allverts = allverts.concat([0, 0, 0, 0, 0, 1, 1, 0, 1]);
        allverts = allverts.concat([0, 0, 0, 1, 0, 1, 1, 0, 0]);

        // Back of cube
        allverts = allverts.concat([0, 0, 1, 1, 1, 1, 1, 0, 1]);
        allverts = allverts.concat([0, 0, 1, 0, 1, 1, 1, 1, 1]);

        drawTriangle3D(allverts);
    }

    renderfaster() {
        var rgba = this.color;

        // Pass the texture number
        gl.uniform1i(u_whichTexture, -2);

        // Pass the color of a point to u_FragColor uniform variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        if (g_vertexBuffer == null) {
            initTriangle3D();
        }

        // Write data into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts32, gl.DYNAMIC_DRAW);

        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }



}

