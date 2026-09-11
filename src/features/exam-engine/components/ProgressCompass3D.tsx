import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ProgressCompass3DProps {
  className?: string;
}

export const ProgressCompass3D: React.FC<ProgressCompass3DProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.5);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xc6a75e, 0.7);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    // Materials
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xc6a75e,
      metalness: 0.85,
      roughness: 0.25,
    });

    const darkNavyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1b2a,
      metalness: 0.5,
      roughness: 0.3,
    });

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x24374e,
      metalness: 0.3,
      roughness: 0.5,
    });

    // Main Milestone Object Group
    const compassGroup = new THREE.Group();

    // 1. Pedestal Base (Octagonal / Cylindrical Base)
    const baseGeo = new THREE.CylinderGeometry(1.0, 1.2, 0.3, 8);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMaterial);
    baseMesh.position.y = -1.1;
    compassGroup.add(baseMesh);

    const ringGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.08, 32);
    const ringMesh = new THREE.Mesh(ringGeo, brassMaterial);
    ringMesh.position.y = -0.9;
    compassGroup.add(ringMesh);

    // 2. Academy Milestone Shield / Disk Body
    const shieldOuterGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.18, 32);
    const shieldOuterMesh = new THREE.Mesh(shieldOuterGeo, brassMaterial);
    shieldOuterMesh.rotation.x = Math.PI / 2;
    shieldOuterMesh.position.y = 0.2;
    compassGroup.add(shieldOuterMesh);

    const shieldInnerGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32);
    const shieldInnerMesh = new THREE.Mesh(shieldInnerGeo, darkNavyMaterial);
    shieldInnerMesh.rotation.x = Math.PI / 2;
    shieldInnerMesh.position.y = 0.2;
    compassGroup.add(shieldInnerMesh);

    // 3. Compass Rose Needle (Pivoted upward pointing north / target direction)
    const needleShape = new THREE.Shape();
    needleShape.moveTo(0, 0.65);
    needleShape.lineTo(0.12, 0);
    needleShape.lineTo(0, -0.65);
    needleShape.lineTo(-0.12, 0);
    needleShape.closePath();

    const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 };
    const needleGeo = new THREE.ExtrudeGeometry(needleShape, extrudeSettings);
    const needleMesh = new THREE.Mesh(needleGeo, brassMaterial);
    needleMesh.position.set(0, 0.2, 0.1);
    compassGroup.add(needleMesh);

    // Center Pivot Cap
    const capGeo = new THREE.SphereGeometry(0.15, 24, 24);
    const capMesh = new THREE.Mesh(capGeo, brassMaterial);
    capMesh.position.set(0, 0.2, 0.16);
    compassGroup.add(capMesh);

    scene.add(compassGroup);

    // Animation Control (Entrance ease over 2 seconds, then static)
    let animationFrameId: number;
    const startTime = performance.now();
    const DURATION_MS = 2200;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1.0);

      if (reducedMotion) {
        compassGroup.rotation.y = 0.2;
        compassGroup.scale.set(1, 1, 1);
        renderer.render(scene, camera);
        return;
      }

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentScale = 0.5 + 0.5 * easeOut;
      compassGroup.scale.set(currentScale, currentScale, currentScale);
      compassGroup.rotation.y = -Math.PI / 3 + (Math.PI / 3 + 0.2) * easeOut;

      renderer.render(scene, camera);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        compassGroup.rotation.y = 0.2;
        compassGroup.scale.set(1, 1, 1);
        renderer.render(scene, camera);
      }
    };

    if (reducedMotion) {
      compassGroup.rotation.y = 0.2;
      renderer.render(scene, camera);
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth || 320;
      const h = mountRef.current.clientHeight || 280;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      brassMaterial.dispose();
      darkNavyMaterial.dispose();
      stoneMaterial.dispose();
      baseGeo.dispose();
      shieldOuterGeo.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-[260px] sm:h-[280px] flex items-center justify-center pointer-events-none relative ${className}`}
      aria-label="3D Progress Compass"
    />
  );
};

export default ProgressCompass3D;
