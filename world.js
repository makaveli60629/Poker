// world.js
import * as THREE from "three";
import { Diagnostics } from "./modules/diagnostics.js";
import { Physics } from "./modules/physics.js";

let interactiveBox;
let table;
let seats = [];

let seated = false;
let seatedSeat = null;

const grabState = new WeakMap();
const seatTouchState = new WeakMap();

export function initWorld(scene) {
  scene.background = new THREE.Color(0x050505);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(2, 6, 2);
  scene.add(key);

  const floorTex = new THREE.TextureLoader().load("./assets/textures/floor.jpg");
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(4, 4);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(2, 48),
    new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.001;
  scene.add(pad);

  table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 1.4, 0.10, 48),
    new THREE.MeshStandardMaterial({ color: 0x054d1a, roughness: 0.95 })
  );
  table.position.set(0, 0.78, -1.0);
  scene.add(table);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 0.75, 24),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1.0 })
  );
  base.position.set(0, 0.38, -1.0);
  scene.add(base);

  seats = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.12, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1.0 })
    );
    seat.position.set(Math.cos(angle) * 2.15, 0.42, -1.0 + Math.sin(angle) * 2.15);
    seat.userData.isSeat = true;
    seat.userData.seatIndex = i;
    seat.lookAt(0, 0.42, -1.0);
    scene.add(seat);
    seats.push(seat);
  }

  interactiveBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x003300 })
  );
  interactiveBox.position.set(0, 1.2, -0.5);
  scene.add(interactiveBox);

  Diagnostics.log("[WORLD]", "initWorld ✅ (pad + table + seats + green box)");
}

export function updateWorld(h1, h2, rig) {
  // Grab prototype (green box)
  if (interactiveBox) {
    const hands = [h1, h2].filter(Boolean);
    let touchingAny = false;

    hands.forEach((hand, i) => {
      const touching = Physics.isTouching(hand, interactiveBox);
      if (!touching) {
        grabState.set(hand, { grabbing: false });
        return;
      }

      touchingAny = true;
      interactiveBox.material.color.set(0xff0000);

      const pinching = Physics.isPinching(hand);
      const st = grabState.get(hand) || { grabbing: false };

      if (pinching && !st.grabbing) {
        grabState.set(hand, { grabbing: true });
        Diagnostics.log("[ACTION]", `Hand ${i} grabbing box`);
      }
      if (!pinching && st.grabbing) {
        grabState.set(hand, { grabbing: false });
        Diagnostics.log("[ACTION]", `Hand ${i} released box`);
      }

      const st2 = grabState.get(hand);
      if (st2?.grabbing) {
        const tip = hand.joints?.["index-finger-tip"];
        if (tip) {
          const wp = new THREE.Vector3();
          tip.getWorldPosition(wp);
          const parent = interactiveBox.parent || rig || null;
          if (parent) {
            const lp = Physics.worldPointToLocal(parent, wp);
            interactiveBox.position.copy(lp);
          } else {
            interactiveBox.position.copy(wp);
          }
        }
      }
    });

    if (!touchingAny) interactiveBox.material.color.set(0x00ff00);
  }

  // Seating prototype: touch seat + pinch to sit/stand
  if (!rig) return;

  seats.forEach(seat => seat.material.color.set(0x333333));
  const hands = [h1, h2].filter(Boolean);

  let hoveredSeat = null;
  for (const hand of hands) {
    for (const seat of seats) {
      if (Physics.isTouching(hand, seat)) {
        seat.material.color.set(0x00ff00);
        hoveredSeat = seat;
      }
    }
  }

  for (const hand of hands) {
    const pinching = Physics.isPinching(hand);
    const prev = seatTouchState.get(hand)?.pinching || false;
    seatTouchState.set(hand, { pinching });

    const justPinched = pinching && !prev;
    if (!justPinched) continue;

    if (!seated && hoveredSeat) {
      seated = true;
      seatedSeat = hoveredSeat;

      const seatPos = new THREE.Vector3();
      hoveredSeat.getWorldPosition(seatPos);

      rig.position.set(seatPos.x, 0, seatPos.z);

      const center = new THREE.Vector3(0, 0, -1.0);
      const dir = center.clone().sub(seatPos);
      const yaw = Math.atan2(dir.x, dir.z);
      rig.rotation.y = yaw;

      Diagnostics.log("[SEAT]", `Seated at seat ${hoveredSeat.userData.seatIndex}`);
      continue;
    }

    if (seated) {
      const prevSeat = seatedSeat?.userData?.seatIndex ?? "?";
      seated = false;
      seatedSeat = null;
      rig.position.set(0, 0, 0);
      Diagnostics.log("[SEAT]", `Stood up (from seat ${prevSeat})`);
    }
  }
}
