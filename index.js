// index.js (Spine)
import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";

import { Diagnostics } from "./modules/diagnostics.js";
import { Locomotion } from "./modules/locomotion.js";
import { initWorld, updateWorld } from "./world.js";

let scene, camera, renderer;
let rig;
let hand0, hand1;

const clock = new THREE.Clock();
const handFactory = new XRHandModelFactory();
const controllerFactory = new XRControllerModelFactory();

init().catch((e) => {
  console.error(e);
  try { Diagnostics.log("[BOOT][ERR]", String(e)); } catch {}
});

async function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  Diagnostics.init();
  Diagnostics.log("[BOOT]", "Spine init ✅");

  rig = new THREE.Group();
  rig.position.set(0, 0, 0);
  scene.add(rig);
  rig.add(camera);

  hand0 = renderer.xr.getHand(0);
  hand0.add(handFactory.createHandModel(hand0, "mesh"));
  rig.add(hand0);

  hand1 = renderer.xr.getHand(1);
  hand1.add(handFactory.createHandModel(hand1, "mesh"));
  rig.add(hand1);

  const grip0 = renderer.xr.getControllerGrip(0);
  grip0.add(controllerFactory.createControllerModel(grip0));
  rig.add(grip0);

  const grip1 = renderer.xr.getControllerGrip(1);
  grip1.add(controllerFactory.createControllerModel(grip1));
  rig.add(grip1);

  initWorld(scene);

  Locomotion.init({ renderer, rigRef: rig });

  window.addEventListener("resize", onResize, { passive: true });
  onResize();

  renderer.setAnimationLoop(loop);
}

function loop() {
  const dt = Math.min(0.05, clock.getDelta());
  Locomotion.update(dt);
  updateWorld(hand0, hand1, rig);
  renderer.render(scene, camera);
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
