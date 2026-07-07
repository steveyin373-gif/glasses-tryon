import * as THREE from 'three';

const { FaceMesh } = window;
const { Camera } = window;
import { createGlasses } from './glasses.js';

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const container = document.getElementById('canvas-container');
const status = document.getElementById('status');
const captureBtn = document.getElementById('capture-btn');

let currentStyle = 'aviator';
let currentColor = '#1a1a1a';
let glassesGroup = null;
let scene, camera3d, renderer;
let videoWidth, videoHeight;

function getContainerSize() {
  return { cw: container.clientWidth, ch: container.clientHeight };
}

function toContainerCoords(nx, ny, nz) {
  const { cw, ch } = getContainerSize();
  const videoAspect = videoWidth / videoHeight;
  const containerAspect = cw / ch;

  let s, ox, oy;
  if (containerAspect > videoAspect) {
    s = cw / videoWidth;
    ox = 0;
    oy = (videoHeight * s - ch) / 2;
  } else {
    s = ch / videoHeight;
    ox = (videoWidth * s - cw) / 2;
    oy = 0;
  }

  const cx = nx * videoWidth * s - ox;
  const cy = ny * videoHeight * s - oy;
  const cz = nz * videoWidth * s;

  return { x: cx, y: cy, z: cz };
}

function initThree() {
  const { cw, ch } = getContainerSize();

  scene = new THREE.Scene();

  camera3d = new THREE.OrthographicCamera(
    -cw / 2, cw / 2,
    ch / 2, -ch / 2,
    0.1, 2000
  );
  camera3d.position.z = 500;

  renderer = new THREE.WebGLRenderer({ canvas: overlay, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(cw, ch, false);
  renderer.setClearColor(0x000000, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(0, 200, 500);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, 0, -300);
  scene.add(rimLight);

  replaceGlasses();
}

function updateRendererSize() {
  if (!renderer) return;
  const { cw, ch } = getContainerSize();

  camera3d.left = -cw / 2;
  camera3d.right = cw / 2;
  camera3d.top = ch / 2;
  camera3d.bottom = -ch / 2;
  camera3d.updateProjectionMatrix();

  renderer.setSize(cw, ch, false);
}

function replaceGlasses() {
  if (glassesGroup) scene.remove(glassesGroup);
  glassesGroup = createGlasses(currentStyle, currentColor);
  glassesGroup.visible = false;
  scene.add(glassesGroup);
}

const KEY_POINTS = {
  noseBridge: 6,
  leftEye: 33,
  rightEye: 263,
  leftTemple: 127,
  rightTemple: 356,
  foreheadTop: 10,
  chin: 152,
};

function onResults(results) {
  if (!renderer) return;

  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    if (glassesGroup) glassesGroup.visible = false;
    renderer.render(scene, camera3d);
    return;
  }

  const { cw, ch } = getContainerSize();
  const landmarks = results.multiFaceLandmarks[0];
  const lm = (idx) => landmarks[idx];

  const toS = (p) => toContainerCoords(p.x, p.y, p.z);

  const leftEyeS = toS(lm(KEY_POINTS.leftEye));
  const rightEyeS = toS(lm(KEY_POINTS.rightEye));
  const foreheadS = toS(lm(KEY_POINTS.foreheadTop));
  const chinS = toS(lm(KEY_POINTS.chin));

  const eyeCenter = {
    x: (leftEyeS.x + rightEyeS.x) / 2,
    y: (leftEyeS.y + rightEyeS.y) / 2,
    z: (leftEyeS.z + rightEyeS.z) / 2,
  };

  const posX = eyeCenter.x - cw / 2;
  const posY = -(eyeCenter.y - ch / 2);
  const posZ = -eyeCenter.z;

  const eyeDistance = Math.sqrt(
    (rightEyeS.x - leftEyeS.x) ** 2 +
    (rightEyeS.y - leftEyeS.y) ** 2
  );
  const scale = eyeDistance / 1.4;

  // roll
  const dx = rightEyeS.x - leftEyeS.x;
  const dy = rightEyeS.y - leftEyeS.y;
  const rollAngle = Math.atan2(dy, dx);

  // pitch: use Z depth between forehead and chin
  const foreheadZ = lm(KEY_POINTS.foreheadTop).z;
  const chinZ = lm(KEY_POINTS.chin).z;
  const pitchZDiff = chinZ - foreheadZ;
  const pitchAngle = Math.atan2(pitchZDiff, eyeDistance) * 0.6;

  // yaw: use Z depth difference between eyes
  const eyeZDiff = rightEyeS.z - leftEyeS.z;
  const yawAngle = Math.atan2(eyeZDiff, eyeDistance) * 0.8;

  // compensate position drift when head rotates
  const yawOffset = Math.sin(yawAngle) * scale * 0.4;
  glassesGroup.position.set(posX + yawOffset, posY + scale * 0.05, posZ);
  glassesGroup.scale.setScalar(scale);
  glassesGroup.rotation.set(pitchAngle, yawAngle, -rollAngle);
  glassesGroup.visible = true;

  renderer.render(scene, camera3d);
}

async function init() {
  const faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    },
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });

  video.srcObject = stream;

  await new Promise(resolve => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });

  videoWidth = video.videoWidth;
  videoHeight = video.videoHeight;
  initThree();

  const ro = new ResizeObserver(() => updateRendererSize());
  ro.observe(container);

  status.textContent = '模型加载中，首次可能需要几秒...';

  const cam = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({ image: video });
    },
    width: videoWidth,
    height: videoHeight,
  });

  await cam.start();
  status.classList.add('hidden');
}

document.querySelectorAll('.glass-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.glass-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    currentStyle = btn.dataset.style;
    replaceGlasses();
  });
});

document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.color-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    currentColor = btn.dataset.color;
    replaceGlasses();
  });
});

captureBtn.addEventListener('click', () => {
  const { cw, ch } = getContainerSize();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = cw;
  canvas.height = ch;

  const videoAspect = videoWidth / videoHeight;
  const containerAspect = cw / ch;
  let s, ox, oy;
  if (containerAspect > videoAspect) {
    s = cw / videoWidth;
    ox = 0;
    oy = (videoHeight * s - ch) / 2;
  } else {
    s = ch / videoHeight;
    ox = (videoWidth * s - cw) / 2;
    oy = 0;
  }

  // draw mirrored video (matching CSS scaleX(-1))
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(
    video,
    ox / s, oy / s, cw / s, ch / s,
    -cw, 0, cw, ch
  );
  ctx.restore();

  // draw glasses overlay (already in correct coords, no mirror needed)
  ctx.drawImage(overlay, 0, 0, cw, ch);

  const link = document.createElement('a');
  link.download = `glasses-tryon-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

init().catch(err => {
  status.textContent = `启动失败: ${err.message}`;
  console.error(err);
});
