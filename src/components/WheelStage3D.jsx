import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../state/store.js';

const DEFAULT_WEDGE_COUNT = 24;

function createTextLabelMesh(text, options = {}) {
  const {
    fontSize = 24,
    color = '#ffffff',
    width = 0.3,
    height = 0.12,
  } = options;

  // Increase canvas resolution for crisp text (4x resolution)
  const canvasWidth = 800;
  const canvasHeight = 240;
  const pixelRatio = 4; // For high DPI displays

  // Create HTML element with proper CSS styling
  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: ${canvasWidth / pixelRatio}px;
    height: ${canvasHeight / pixelRatio}px;
    background: transparent;
    color: ${color};
    font-family: Arial, sans-serif;
    font-size: ${fontSize}px;
    font-weight: bold;
    text-align: center;
    line-height: ${canvasHeight / pixelRatio}px;
    text-shadow:
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 0 6px #000,
      0 0 12px #000;
    white-space: nowrap;
    overflow: hidden;
  `;
  div.textContent = text;
  document.body.appendChild(div);

  // Convert to canvas with high resolution
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  // Enable high-quality text rendering
  ctx.textRenderingOptimization = 'optimizeQuality';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Scale context for high DPI
  ctx.scale(pixelRatio, pixelRatio);

  // Render the styled text to canvas
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Enhanced black outline with better antialiasing
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeText(text, canvasWidth / (2 * pixelRatio), canvasHeight / (2 * pixelRatio));

  // Add subtle glow effect
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 4;
  ctx.fillText(text, canvasWidth / (2 * pixelRatio), canvasHeight / (2 * pixelRatio));

  // Clean up
  document.body.removeChild(div);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false; // Prevent blurriness
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  const material = new THREE.MeshBasicMaterial({ 
    map: texture, 
    transparent: true,
    alphaTest: 0.1 // Helps with text clarity
  });
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.size = { width, height };
  mesh.userData.dispose = () => { material.map.dispose(); material.dispose(); geometry.dispose(); };
  return mesh;
}

export default function WheelStage3D({ spinToken, onSpinEnd }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    spinning: false,
    angle: 0,
    angularVelocity: 0,
    zoomCountdown: 0,
    showedDecel: false,
    zoomPersistent: false,
    spinOwnerIndex: 0,
  });

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    
    // Enhanced background with studio-like atmosphere
    scene.background = new THREE.Color(0x050812);
    scene.fog = new THREE.Fog(0x050812, 8, 15);
    
    // Shared geometry params
    const radius = 1.2;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Place camera above and slightly towards positive Z looking down so +Z is up on screen
    camera.position.set(0, 0, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(420, 420);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // Increased brightness to reduce shadow appearance
    renderer.clearColor = new THREE.Color(0x050812); // Explicit clear color
    renderer.domElement.className = 'wheel-canvas';
    renderer.domElement.setAttribute('data-testid', 'wheel');
    mount.appendChild(renderer.domElement);

    // Zoom renderer overlay
    const rendererZoom = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererZoom.setSize(220, 220);
    rendererZoom.shadowMap.enabled = true;
    rendererZoom.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererZoom.outputColorSpace = THREE.SRGBColorSpace;
    rendererZoom.toneMapping = THREE.ACESFilmicToneMapping;
    rendererZoom.toneMappingExposure = 1.4; // Match main renderer
    rendererZoom.domElement.className = 'zoom-overlay';
    rendererZoom.domElement.setAttribute('data-testid', 'zoom');
    rendererZoom.domElement.style.display = 'none';
    mount.appendChild(rendererZoom.domElement);

    // Enhanced lighting setup for studio atmosphere with reduced shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8); // Reduced intensity
    mainLight.position.set(3, 4, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024; // Reduced shadow resolution for softer shadows
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001; // Reduce shadow acne
    mainLight.shadow.radius = 8; // Softer shadow edges
    scene.add(mainLight);

    // Key fill light with more intensity
    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.5);
    fillLight.position.set(-2, 2, 3);
    scene.add(fillLight);

    // Increased ambient light for overall illumination to reduce shadows
    scene.add(new THREE.AmbientLight(0x404080, 0.8)); // Doubled ambient light

    // Rim light for dramatic effect (reduced intensity)
    const rimLight = new THREE.DirectionalLight(0xffd700, 0.5);
    rimLight.position.set(0, -3, 2);
    scene.add(rimLight);

    // Zoom camera (tighter FOV)
    const cameraZoom = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    // Focus near the pointer area at top of wheel (y ≈ radius)
    const focusY = radius;
    cameraZoom.position.set(0, focusY, 2.0);
    cameraZoom.lookAt(0, focusY, 0.02);

    // Wheel facing the user (in XY), spinning around Z
    const wheelGroup = new THREE.Group();
    wheelGroup.castShadow = true;
    wheelGroup.receiveShadow = true;
    scene.add(wheelGroup);

    // Colored wedge sectors
    const wedgeGroup = new THREE.Group();
    wheelGroup.add(wedgeGroup);

    const wedgesData = useGameStore.getState().wheel.wedges || [];
    const wedgeCount = wedgesData.length || DEFAULT_WEDGE_COUNT;
    
    // Enhanced color palette with more vibrant, TV-show-like colors
    const colors = [
      0xff1744, // Bright Red
      0x8e24aa, // Purple
      0x1976d2, // Blue
      0x00acc1, // Cyan
      0x00796b, // Teal
      0x388e3c, // Green
      0xfbc02d, // Yellow
      0xff9800, // Orange
      0x5d4037, // Brown
      0xe91e63, // Pink
      0x673ab7, // Deep Purple
      0x3f51b5  // Indigo
    ];
    
    const colorFor = (i) => {
      const w = wedgesData[i];
      if (w?.type === 'Bankrupt') return 0x1a0000; // Dark red
      if (w?.type === 'LoseTurn') return 0x2a2a2a; // Dark gray
      return colors[i % colors.length];
    };

    for (let i = 0; i < wedgeCount; i++) {
      const angleStart = (i / wedgeCount) * Math.PI * 2;
      const angleEnd = ((i + 1) / wedgeCount) * Math.PI * 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      const steps = 16; // More steps for smoother curves
      for (let s = 0; s <= steps; s++) {
        const t = angleStart + (s / steps) * (angleEnd - angleStart);
        shape.lineTo(Math.cos(t) * radius, Math.sin(t) * radius);
      }
      shape.lineTo(0, 0);
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01 });
      
      // Enhanced material with metallic properties
      const mat = new THREE.MeshStandardMaterial({ 
        color: colorFor(i), 
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color(colorFor(i)).multiplyScalar(0.05)
      });
      
      const mesh = new THREE.Mesh(extrude, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Sits in XY plane; lift slightly to avoid z-fighting
      mesh.position.z = 0.01;
      wedgeGroup.add(mesh);
    }

    // Enhanced rim with metallic gold appearance
    const ringGeo = new THREE.RingGeometry(radius * 0.96, radius + 0.02, 64);
    const ringMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, 
      metalness: 0.8, 
      roughness: 0.2,
      emissive: 0x332200,
      side: THREE.DoubleSide 
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.04;
    ring.castShadow = true;
    ring.receiveShadow = true;
    wheelGroup.add(ring);

    // Enhanced pointer with chrome-like finish
    const pointerGeo = new THREE.ConeGeometry(0.08, 0.2, 16);
    const pointerMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      metalness: 0.9, 
      roughness: 0.1,
      emissive: 0x111111
    });
    const pointer = new THREE.Mesh(pointerGeo, pointerMat);
    pointer.rotation.x = Math.PI; // point down onto wheel
    pointer.position.set(0, radius + 0.1, 0.25);
    pointer.castShadow = true;
    scene.add(pointer);

    // Add a base/pedestal for the wheel
    const baseGeo = new THREE.CylinderGeometry(radius * 0.3, radius * 0.4, 0.1, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x333366,
      metalness: 0.6,
      roughness: 0.4
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.z = -0.1;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // Text labels for wedges (improved sizing and positioning)
    const labelsGroup = new THREE.Group();
    const wedgeAngle = (Math.PI * 2) / wedgeCount;
    const labelRadius = radius * 0.7; // Optimal distance from center
    
    for (let i = 0; i < wedgeCount; i++) {
      const label = wedgesData[i]?.label || '';
      if (!label) continue; // Skip empty labels
      
      // Calculate optimal text size based on wedge dimensions
      const arcLen = labelRadius * wedgeAngle;
      const maxTextWidth = arcLen * 0.8; // Leave some margin
      const maxTextHeight = radius * 0.15; // Reasonable height limit
      
      // Dynamic font size based on text length and available space
      let fontSize = 18;
      if (label.length > 10) fontSize = 14;
      else if (label.length > 6) fontSize = 16;
      else if (label.length < 4) fontSize = 22;
      
      const mesh = createTextLabelMesh(label, {
        width: maxTextWidth,
        height: maxTextHeight,
        fontSize: fontSize
      });
      
      // Position text in the center of each wedge
      const theta = ((i + 0.5) / wedgeCount) * Math.PI * 2;
      mesh.position.set(
        Math.cos(theta) * labelRadius, 
        Math.sin(theta) * labelRadius, 
        0.15 // Slightly higher to avoid z-fighting
      );
      
      // Rotate text to be readable - always upright orientation
      let rot = theta;
      // Keep text upright by rotating 180° for text on the left side
      if (Math.cos(theta) < 0) {
        rot += Math.PI;
      }
      // Ensure text is never upside down
      rot = ((rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (rot > Math.PI / 2 && rot < 3 * Math.PI / 2) {
        rot += Math.PI;
      }
      mesh.rotation.z = rot;
      
      labelsGroup.add(mesh);
    }
    wheelGroup.add(labelsGroup);

    // Test hook: expose measurement helper for Playwright
    if (typeof window !== 'undefined') {
      window.__wheelTest = {
        getLabelMetrics: () => {
          const metrics = [];
          const wedgeAngleLocal = (Math.PI * 2) / wedgeCount;
          for (const child of labelsGroup.children) {
            const bbox = new THREE.Box3().setFromObject(child);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const arcLen = labelRadius * wedgeAngleLocal;
            metrics.push({
              width: size.x,
              height: size.y,
              arcLen,
              widthRatio: size.x / arcLen,
              heightToRadius: size.y / radius,
            });
          }
          return { wedgeCount, radius, labelRadius, wedgeAngle: wedgeAngleLocal, metrics };
        }
      };
    }

    const clock = new THREE.Clock();
    let req;
    function animate() {
      req = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const st = stateRef.current;
      if (st.spinning) {
        // Faster decay so spins resolve in ~2–3s
        st.angularVelocity *= 0.98;
        st.angularVelocity = Math.max(0, st.angularVelocity - 0.002 * dt * 60);
        st.angle += st.angularVelocity * dt * 60;
        // Show zoom once during deceleration
        if (!st.showedDecel && st.angularVelocity < 0.08) {
          st.showedDecel = true;
          st.zoomCountdown = 2.0;
          rendererZoom.domElement.style.display = 'block';
        }
        if (st.angularVelocity < 0.02) {
          st.spinning = false;
          // Resolve wedge index at pointer (12 o'clock)
          const TAU = Math.PI * 2;
          const a = ((st.angle % TAU) + TAU) % TAU; // normalized [0, 2π)
          const pointerAngle = Math.PI / 2; // +Y
          const relative = (pointerAngle - a + TAU) % TAU;
          const wedgeIndex = Math.floor((relative / TAU) * wedgeCount) % wedgeCount;
          onSpinEnd?.(wedgeIndex);
          // Keep zoom until the spinning player's turn ends
          st.zoomPersistent = true;
          st.zoomCountdown = Math.max(st.zoomCountdown, 1.0);
        }
      }
      // Spin around Z while facing the user; positive = CCW
      wheelGroup.rotation.z = stateRef.current.angle;
      renderer.render(scene, camera);

      // Zoom overlay countdown
      // Persist if player's turn is ongoing
      if (st.zoomPersistent) {
        const { currentPlayerIndex, phase } = useGameStore.getState();
        const samePlayer = currentPlayerIndex === st.spinOwnerIndex;
        const turnOngoing = samePlayer && phase !== 'TurnAI' && phase !== 'TurnHuman' && phase !== 'Title' && phase !== 'RoundEnd' && phase !== 'GameEnd' && phase !== 'Spin';
        if (!turnOngoing) st.zoomPersistent = false;
      }

      if (st.zoomCountdown > 0 || st.zoomPersistent) {
        st.zoomCountdown -= dt;
        rendererZoom.render(scene, cameraZoom);
        rendererZoom.domElement.style.display = 'block';
      } else {
        rendererZoom.domElement.style.display = 'none';
      }
    }
    animate();

    return () => {
      cancelAnimationFrame(req);
      renderer.dispose();
      rendererZoom.dispose();
      mount.removeChild(renderer.domElement);
      mount.removeChild(rendererZoom.domElement);
    };
  }, [onSpinEnd]);

  // Trigger spin on token change
  useEffect(() => {
    if (!spinToken) return;
    const st = stateRef.current;
    if (st.spinning) return;
    st.spinning = true;
    st.angularVelocity = 0.25 + Math.random() * 0.5; // initial speed
    // Hide zoom when spin starts
    st.zoomCountdown = 0;
    st.showedDecel = false;
    st.zoomPersistent = false;
    st.spinOwnerIndex = useGameStore.getState().currentPlayerIndex;
  }, [spinToken]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mountRef} aria-label="Wheel stage" />
    </div>
  );
}


