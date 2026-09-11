import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface PassCelebration3DProps {
  className?: string;
}

export const PassCelebration3D: React.FC<PassCelebration3DProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
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
    camera.position.set(0, 1.2, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xc6a75e, 0.9);
    fillLight.position.set(-3, -1, 2);
    scene.add(fillLight);

    // Materials - Premium Brass & Gold
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xc6a75e,
      metalness: 0.85,
      roughness: 0.2,
    });

    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0x8c6d28,
      metalness: 0.9,
      roughness: 0.25,
    });

    const darkBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0e1b2a,
      metalness: 0.4,
      roughness: 0.3,
    });

    const emeraldConfettiMat = new THREE.MeshStandardMaterial({
      color: 0x234e35,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });

    const goldConfettiMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.8,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    // Trophy Group
    const trophyGroup = new THREE.Group();

    // 1. Pedestal Base
    const baseGeo = new THREE.CylinderGeometry(0.8, 0.95, 0.35, 32);
    const baseMesh = new THREE.Mesh(baseGeo, darkBaseMaterial);
    baseMesh.position.y = -1.1;
    trophyGroup.add(baseMesh);

    const baseRingGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.1, 32);
    const baseRingMesh = new THREE.Mesh(baseRingGeo, brassMaterial);
    baseRingMesh.position.y = -0.85;
    trophyGroup.add(baseRingMesh);

    // 2. Stem Pillar
    const stemGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.7, 24);
    const stemMesh = new THREE.Mesh(stemGeo, brassMaterial);
    stemMesh.position.y = -0.45;
    trophyGroup.add(stemMesh);

    const stemKnobGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const stemKnobMesh = new THREE.Mesh(stemKnobGeo, goldMaterial);
    stemKnobMesh.position.y = -0.1;
    stemKnobMesh.scale.set(1, 0.6, 1);
    trophyGroup.add(stemKnobMesh);

    // 3. Trophy Cup Body
    const cupGeo = new THREE.CylinderGeometry(0.9, 0.35, 1.2, 32, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, goldMaterial);
    cupMesh.position.y = 0.6;
    trophyGroup.add(cupMesh);

    const cupBottomGeo = new THREE.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const cupBottomMesh = new THREE.Mesh(cupBottomGeo, goldMaterial);
    cupBottomMesh.position.y = 0.0;
    trophyGroup.add(cupBottomMesh);

    const cupRimGeo = new THREE.TorusGeometry(0.9, 0.06, 16, 48);
    const cupRimMesh = new THREE.Mesh(cupRimGeo, brassMaterial);
    cupRimMesh.rotation.x = Math.PI / 2;
    cupRimMesh.position.y = 1.2;
    trophyGroup.add(cupRimMesh);

    // 4. Handles (Left & Right)
    const handleGeo = new THREE.TorusGeometry(0.45, 0.05, 16, 32, Math.PI);
    
    const leftHandle = new THREE.Mesh(handleGeo, brassMaterial);
    leftHandle.position.set(-0.75, 0.6, 0);
    leftHandle.rotation.z = Math.PI / 2 + 0.2;
    trophyGroup.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, brassMaterial);
    rightHandle.position.set(0.75, 0.6, 0);
    rightHandle.rotation.z = -Math.PI / 2 - 0.2;
    trophyGroup.add(rightHandle);

    scene.add(trophyGroup);

    // Confetti Particles (Tasteful controlled dispersion)
    const confettiCount = 30;
    const confettiGroup = new THREE.Group();
    const confettiItems: { mesh: THREE.Mesh; vx: number; vy: number; vrx: number; vry: number }[] = [];

    const planeGeo = new THREE.PlaneGeometry(0.08, 0.08);

    for (let i = 0; i < confettiCount; i++) {
      const mat = Math.random() > 0.4 ? goldConfettiMat : emeraldConfettiMat;
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2.5 + 0.5,
        (Math.random() - 0.5) * 2
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      confettiItems.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.012,
        vy: (Math.random() - 0.5) * 0.008 - 0.004,
        vrx: (Math.random() - 0.5) * 0.04,
        vry: (Math.random() - 0.5) * 0.04,
      });
      confettiGroup.add(mesh);
    }

    if (!reducedMotion) {
      scene.add(confettiGroup);
    }

    // Animation Lifecycle Control (Runs once over 3.2 seconds, then settles static)
    let animationFrameId: number;
    const startTime = performance.now();
    const DURATION_MS = 3200;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1.0);

      if (reducedMotion) {
        trophyGroup.rotation.y = 0.15;
        trophyGroup.scale.set(1, 1, 1);
        renderer.render(scene, camera);
        return;
      }

      // Smooth easeOutCubic curve for trophy rotation and scale entrance
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentScale = 0.3 + 0.7 * easeOut;
      trophyGroup.scale.set(currentScale, currentScale, currentScale);
      trophyGroup.rotation.y = -Math.PI / 4 + (Math.PI / 4 + 0.15) * easeOut;

      confettiItems.forEach((item) => {
        item.mesh.position.x += item.vx;
        item.mesh.position.y += item.vy;
        item.mesh.rotation.x += item.vrx;
        item.mesh.rotation.y += item.vry;

        const mat = item.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(1.0 - progress * 1.2, 0);
        mat.transparent = true;
      });

      renderer.render(scene, camera);

      if (progress < 1.0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        scene.remove(confettiGroup);
        trophyGroup.rotation.y = 0.15;
        trophyGroup.scale.set(1, 1, 1);
        renderer.render(scene, camera);
      }
    };

    if (reducedMotion) {
      trophyGroup.rotation.y = 0.15;
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
      goldMaterial.dispose();
      brassMaterial.dispose();
      darkBaseMaterial.dispose();
      baseGeo.dispose();
      cupGeo.dispose();
      stemGeo.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-[260px] sm:h-[300px] flex items-center justify-center pointer-events-none relative ${className}`}
      aria-label="3D Celebration Trophy"
    />
  );
};

export default PassCelebration3D;
