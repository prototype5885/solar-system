async function loadShaderSource(url) {
  const response = await fetch(url);
  if (!response.ok) {
    alert(`Could not load shader at ${url}`);
  }
  return await response.text();
}

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createSphere(radius, bands) {
  const positions = [];
  const normals = [];
  const indices = [];
  const texCoords = [];

  for (let lat = 0; lat <= bands; lat++) {
    const theta = (lat * Math.PI) / bands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= bands; lon++) {
      const phi = (lon * 2 * Math.PI) / bands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      normals.push(x, y, z);
      positions.push(radius * x, radius * y, radius * z);

      // calculate texture UV
      const u = 1 - lon / bands;
      const v = 1 - lat / bands;
      texCoords.push(u, v);
    }
  }

  for (let lat = 0; lat < bands; lat++) {
    for (let lon = 0; lon < bands; lon++) {
      const first = lat * (bands + 1) + lon;
      const second = first + bands + 1;
      indices.push(first, first + 1, second);
      indices.push(second, first + 1, second + 1);
    }
  }
  return { positions, normals, indices, texCoords };
}

async function main() {
  const canvas = document.querySelector("#gl-canvas");
  const gl = canvas.getContext("webgl");

  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it.",
    );
    return;
  }

  const vsSource = await loadShaderSource("shader.vert");
  const fsSource = await loadShaderSource("shader.frag");

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  gl.useProgram(shaderProgram);

  const locPosition = gl.getAttribLocation(shaderProgram, "aPosition");
  const locNormal = gl.getAttribLocation(shaderProgram, "aNormal");
  const locModel = gl.getUniformLocation(shaderProgram, "uModel");
  const locView = gl.getUniformLocation(shaderProgram, "uView");
  const locProjection = gl.getUniformLocation(shaderProgram, "uProjection");
  // const locColor = gl.getUniformLocation(shaderProgram, "uColor");
  const locIsSun = gl.getUniformLocation(shaderProgram, "uIsSun");
  const locTexCoord = gl.getAttribLocation(shaderProgram, "aTexCoord");
  const locTexture = gl.getUniformLocation(shaderProgram, "uTexture");
  const locUseNightTexture = gl.getUniformLocation(
    shaderProgram,
    "uUseNightTexture",
  );
  const locTextureDark = gl.getUniformLocation(shaderProgram, "uTextureDark");

  const sphereData = createSphere(1, 60);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(sphereData.positions),
    gl.STATIC_DRAW,
  );

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(sphereData.normals),
    gl.STATIC_DRAW,
  );

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(sphereData.texCoords),
    gl.STATIC_DRAW,
  );

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(sphereData.indices),
    gl.STATIC_DRAW,
  );

  // camera position
  let camPos = [0, 0, 3000]; // starting position
  let camYaw = (-180 * Math.PI) / 180;
  let camPitch = (0 * Math.PI) / 180;

  let keys = {};

  // input handling
  window.addEventListener("keydown", (e) => (keys[e.code] = true));
  window.addEventListener("keyup", (e) => (keys[e.code] = false));

  canvas.addEventListener("click", () =>
    canvas.requestPointerLock({ unadjustedMovement: true }),
  );

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement === canvas) {
      camYaw += e.movementX * 0.002;
      camPitch -= e.movementY * 0.002;

      // clamp when looking up/down
      const limit = Math.PI / 2 - 0.01;
      camPitch = Math.max(-limit, Math.min(limit, camPitch));
    }
  });

  const skyboxTexture = loadTexture(gl, "textures/8k_stars_milky_way.webp");

  planets.forEach((p) => {
    // load texture for each planets
    p.texture = loadTexture(gl, `textures/2k_${p.name}.webp`);
    if (p.name == "earth") {
      // only earth has dark side texture
      p.textureDark = loadTexture(gl, `textures/2k_${p.name}_nightmap.webp`);
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // randomize starting position
    p.offset = Math.random() * Math.PI * 2;
    // p.offset = 1;
  });

  // render loop
  let lastTime = 0;

  function render(time) {
    time *= 0.001;
    const deltaTime = time - lastTime;
    lastTime = time;

    // update viewport on resizing
    if (
      canvas.width !== canvas.clientWidth ||
      canvas.height !== canvas.clientHeight
    ) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // WASD movement handling
    if (document.pointerLockElement === canvas) {
      const defaultSpeed = 250 * deltaTime;
      let speed = defaultSpeed;
      const forward = [
        Math.sin(camYaw) * Math.cos(camPitch),
        -Math.sin(camPitch),
        -Math.cos(camYaw) * Math.cos(camPitch),
      ];
      const right = [Math.cos(camYaw), 0, Math.sin(camYaw)];

      if (keys["ShiftLeft"]) {
        speed *= 4;
      } else {
        speed = defaultSpeed;
      }

      if (keys["KeyW"]) {
        camPos[0] -= forward[0] * speed;
        camPos[1] -= forward[1] * speed;
        camPos[2] -= forward[2] * speed;
      }
      if (keys["KeyS"]) {
        camPos[0] += forward[0] * speed;
        camPos[1] += forward[1] * speed;
        camPos[2] += forward[2] * speed;
      }
      if (keys["KeyA"]) {
        camPos[0] += right[0] * speed;
        camPos[1] += right[1] * speed;
        camPos[2] += right[2] * speed;
      }
      if (keys["KeyD"]) {
        camPos[0] -= right[0] * speed;
        camPos[1] -= right[1] * speed;
        camPos[2] -= right[2] * speed;
      }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    // gl.frontFace(gl.CW);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    const projection = glMatrix.mat4.create();
    glMatrix.mat4.perspective(
      projection,
      (60 * Math.PI) / 180,
      canvas.width / canvas.height,
      1,
      1000000.0,
    );

    const view = glMatrix.mat4.create();
    const target = [
      camPos[0] - Math.sin(camYaw) * Math.cos(camPitch),
      camPos[1] + Math.sin(camPitch),
      camPos[2] + Math.cos(camYaw) * Math.cos(camPitch),
    ];

    glMatrix.mat4.lookAt(view, camPos, target, [0, 1, 0]);

    gl.uniformMatrix4fv(locView, false, view);
    gl.uniformMatrix4fv(locProjection, false, projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(locPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(locNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // draw space background
    gl.cullFace(gl.FRONT);
    gl.depthMask(false);

    const skyboxModel = glMatrix.mat4.create();
    glMatrix.mat4.translate(skyboxModel, skyboxModel, camPos);
    glMatrix.mat4.scale(skyboxModel, skyboxModel, [100, 100, 100]);

    gl.uniformMatrix4fv(locModel, false, skyboxModel);
    gl.uniform1i(locIsSun, 1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
    gl.uniform1i(locTexture, 0);

    gl.drawElements(
      gl.TRIANGLES,
      sphereData.indices.length,
      gl.UNSIGNED_SHORT,
      0,
    );

    gl.depthMask(true);
    gl.cullFace(gl.BACK);

    // draw planets
    planets.forEach((p) => {
      const model = glMatrix.mat4.create();

      // orbiting
      const orbitSpeed = 1 / p.orbitSpeed;
      if (p.isSun) {
        glMatrix.mat4.translate(model, model, [0, 0, 0]);
      } else {
        const angle = time * orbitSpeed + p.offset;
        const x = Math.cos(angle) * p.dist;
        const z = Math.sin(angle) * p.dist;

        glMatrix.mat4.translate(model, model, [x, 0, z]);
      }

      glMatrix.mat4.scale(model, model, [p.diameter, p.diameter, p.diameter]);

      // spinning
      const spinSpeedMultiplier = 1.0;
      glMatrix.mat4.rotateY(
        model,
        model,
        (time / p.spinSpeed) * spinSpeedMultiplier,
      );

      gl.uniformMatrix4fv(locModel, false, model);
      // gl.uniform3fv(locColor, p.color);
      gl.uniform1i(locIsSun, p.isSun ? 1 : 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.vertexAttribPointer(locTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(locTexCoord);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, p.texture);
      gl.uniform1i(locTexture, 0);

      if (p.textureDark) {
        // if there is dark side texture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, p.textureDark);
        gl.uniform1i(locTextureDark, 1);

        gl.uniform1i(locUseNightTexture, 1);
      } else {
        // if there is no
        gl.uniform1i(locUseNightTexture, 0);
      }
      gl.drawElements(
        gl.TRIANGLES,
        sphereData.indices.length,
        gl.UNSIGNED_SHORT,
        0,
      );
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
