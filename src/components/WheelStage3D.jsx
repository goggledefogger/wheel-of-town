import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../state/store.js';

const DEFAULT_WEDGE_COUNT = 24;

function createTextLabelMesh(text, options = {}) {
  const {
    color = '#ffffff',
    maxWidth = 0.3,
    maxHeight = 0.12,
    arcLength = 0.2,
  } = options;

  // Helper function to measure text width
  function measureText(text, font) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  // Split long text into multiple lines if needed
  function wrapText(text, maxWidth, fontSize) {
    const words = text.split(' ');
    if (words.length === 1) return [text]; // Single word, don't wrap
    
    const lines = [];
    let currentLine = '';
    const font = `bold ${fontSize}px Arial, sans-serif`;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = measureText(testLine, font);
      
      if (testWidth <= maxWidth && currentLine) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }

  // Calculate optimal font size and layout
  function calculateOptimalLayout(text, availableWidth, availableHeight) {
    let fontSize = 24;
    let lines = [text];
    let totalHeight;
    
    // Find the largest font size that fits
    for (let size = 24; size >= 12; size -= 1) {
      const font = `bold ${size}px Arial, sans-serif`;
      const singleLineWidth = measureText(text, font);
      
      // Try single line first
      if (singleLineWidth <= availableWidth) {
        fontSize = size;
        lines = [text];
        totalHeight = size;
        break;
      }
      
      // Try multi-line if single line doesn't fit
      const testLines = wrapText(text, availableWidth, size);
      const lineHeight = size * 1.1; // 10% line spacing
      const testTotalHeight = testLines.length * lineHeight;
      
      if (testTotalHeight <= availableHeight) {
        // Check if all lines fit within width
        const allLinesFit = testLines.every(line => 
          measureText(line, font) <= availableWidth
        );
        
        if (allLinesFit) {
          fontSize = size;
          lines = testLines;
          totalHeight = testTotalHeight;
          break;
        }
      }
    }
    
    return { fontSize, lines, totalHeight };
  }

  // Calculate available space (make it proportional to arc length)
  const availableWidth = Math.max(120, Math.min(250, arcLength * 400));
  const availableHeight = Math.max(40, Math.min(80, maxHeight * 400));
  
  const layout = calculateOptimalLayout(text, availableWidth, availableHeight);
  
  // Create canvas with appropriate size
  const canvasWidth = availableWidth + 20; // padding
  const canvasHeight = Math.max(60, layout.totalHeight + 20); // padding
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  // Set up text rendering
  ctx.fillStyle = color;
  ctx.font = `bold ${layout.fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw each line
  const lineHeight = layout.fontSize * 1.1;
  const startY = canvasHeight / 2 - ((layout.lines.length - 1) * lineHeight) / 2;
  
  layout.lines.forEach((line, index) => {
    const y = startY + (index * lineHeight);
    
    // Black outline for readability
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(2, layout.fontSize / 10);
    ctx.strokeText(line, canvasWidth / 2, y);
    
    // White text fill
    ctx.fillText(line, canvasWidth / 2, y);
  });

  // Create texture and mesh
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  
  // Calculate final mesh dimensions based on content
  const aspectRatio = canvasWidth / canvasHeight;
  const finalHeight = Math.min(maxHeight, maxWidth / aspectRatio);
  const finalWidth = finalHeight * aspectRatio;
  
  const geometry = new THREE.PlaneGeometry(finalWidth, finalHeight);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.size = { width: finalWidth, height: finalHeight };
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
    scene.background = new THREE.Color(0x0c0c0f);
    // Shared geometry params
    const radius = 1.2;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Place camera above and slightly towards positive Z looking down so +Z is up on screen
    camera.position.set(0, 0, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(420, 420);
    renderer.domElement.className = 'wheel-canvas';
    renderer.domElement.setAttribute('data-testid', 'wheel');
    mount.appendChild(renderer.domElement);

    // Zoom renderer overlay
    const rendererZoom = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererZoom.setSize(220, 220);
    rendererZoom.domElement.className = 'zoom-overlay';
    rendererZoom.domElement.setAttribute('data-testid', 'zoom');
    rendererZoom.domElement.style.display = 'none';
    mount.appendChild(rendererZoom.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 3, 4);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Zoom camera (tighter FOV)
    const cameraZoom = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    // Focus near the pointer area at top of wheel (y ≈ radius)
    const focusY = radius;
    cameraZoom.position.set(0, focusY, 2.0);
    cameraZoom.lookAt(0, focusY, 0.02);

    // Wheel facing the user (in XY), spinning around Z
    const wheelGroup = new THREE.Group();
    scene.add(wheelGroup);

    // Colored wedge sectors
    const wedgeGroup = new THREE.Group();
    wheelGroup.add(wedgeGroup);

    const wedgesData = useGameStore.getState().wheel.wedges || [];
    const wedgeCount = wedgesData.length || DEFAULT_WEDGE_COUNT;
    const colors = [0xe53935, 0x8e24aa, 0x3949ab, 0x1e88e5, 0x00897b, 0x43a047, 0xfdd835, 0xfb8c00, 0x6d4c41];
    const colorFor = (i) => {
      const w = wedgesData[i];
      if (w?.type === 'Bankrupt') return 0x000000;
      if (w?.type === 'LoseTurn') return 0x5a5a5a;
      return colors[i % colors.length];
    };

    for (let i = 0; i < wedgeCount; i++) {
      const angleStart = (i / wedgeCount) * Math.PI * 2;
      const angleEnd = ((i + 1) / wedgeCount) * Math.PI * 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      const steps = 12;
      for (let s = 0; s <= steps; s++) {
        const t = angleStart + (s / steps) * (angleEnd - angleStart);
        shape.lineTo(Math.cos(t) * radius, Math.sin(t) * radius);
      }
      shape.lineTo(0, 0);
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
      const mat = new THREE.MeshStandardMaterial({ color: colorFor(i), roughness: 0.6 });
      const mesh = new THREE.Mesh(extrude, mat);
      // Sits in XY plane; lift slightly to avoid z-fighting
      mesh.position.z = 0.01;
      wedgeGroup.add(mesh);
    }

    // Rim disc (thin ring) for nicer look
    const ringGeo = new THREE.RingGeometry(radius * 0.96, radius, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x222833, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.04;
    wheelGroup.add(ring);

    // Pointer at 12 o'clock (+Y), in front of wheel
    const pointerGeo = new THREE.ConeGeometry(0.06, 0.16, 12);
    const pointerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.4 });
    const pointer = new THREE.Mesh(pointerGeo, pointerMat);
    pointer.rotation.x = Math.PI; // point down onto wheel
    pointer.position.set(0, radius + 0.08, 0.2);
    scene.add(pointer);

    // Text labels for wedges (no background boxes, natural orientation)
    const labelsGroup = new THREE.Group();
    const wedgeAngle = (Math.PI * 2) / wedgeCount;
    const outerEdge = radius * 0.98; // near rim
    for (let i = 0; i < wedgeCount; i++) {
      const label = wedgesData[i]?.label || '';
      const arcLen = outerEdge * wedgeAngle;
      const mesh = createTextLabelMesh(label, {
        maxWidth: radius * 0.4, // Max width based on radius
        maxHeight: radius * 0.2, // Max height based on radius
        arcLength: arcLen // Pass arc length for dynamic sizing
      });
      const theta = ((i + 0.5) / wedgeCount) * Math.PI * 2;
      // Position text closer to the rim for better visibility, but still within the wedge
      const labelRadius = radius * 0.8;
      mesh.position.set(Math.cos(theta) * labelRadius, Math.sin(theta) * labelRadius, 0.12);
      
      // Improved rotation logic for better readability
      let rot = theta;
      // Keep text readable by rotating text that would be upside down
      if (theta > Math.PI / 2 && theta < 3 * Math.PI / 2) {
        rot += Math.PI; // Flip text that would be upside down
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
          const labelRadiusLocal = radius * 0.8; // Same as used above
          for (const child of labelsGroup.children) {
            const bbox = new THREE.Box3().setFromObject(child);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const arcLen = labelRadiusLocal * wedgeAngleLocal;
            metrics.push({
              width: size.x,
              height: size.y,
              arcLen,
              widthRatio: size.x / arcLen,
              heightToRadius: size.y / radius,
            });
          }
          return { wedgeCount, radius, labelRadius: labelRadiusLocal, wedgeAngle: wedgeAngleLocal, metrics };
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


