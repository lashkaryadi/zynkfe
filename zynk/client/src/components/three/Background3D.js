
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 100 }) {
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
        const time = Math.random() * 100;
        const factor = Math.random() * 100 + 20;
        const speed = Math.random() * 0.01 + 0.001;
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 50;
        
        temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);
  
  useFrame((state) => {
    particles.forEach((particle, i) => {
        let { speed, x, y, z } = particle;
        // Update rotation manually or use a simple movement logic
        // For standard mesh with instancing we would do more, but here we just render spheres
    });
    // Rotate the whole group essentially
    if(mesh.current) {
        mesh.current.rotation.y += 0.0005;
        mesh.current.rotation.z += 0.0002;
    }
  });

  return (
    <group ref={mesh}>
      {particles.map((dummy, i) => (
         <Float key={i} speed={dummy.speed * 20} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[dummy.x, dummy.y, dummy.z]}>
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#FF0050" : "#00F2EA"} transparent opacity={0.2} />
            </mesh>
         </Float>
      ))}
    </group>
  );
}

export default function Background3D() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.6 }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }}>
        <fog attach="fog" args={['#050510', 10, 40]} />
        <ambientLight intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Particles count={60} />
      </Canvas>
    </div>
  );
}
