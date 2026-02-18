import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSound } from '../../hooks/useSound';

function PlatformBar({ position, height, color, label, value }) {
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);
  const { playHover } = useSound();

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth scaling
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, height, 0.1);
      // Hover effect
      const targetScale = hovered ? 1.1 : 1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef} 
        position={[0, height / 2, 0]} 
        onPointerOver={() => { setHover(true); playHover(); }}
        onPointerOut={() => setHover(false)}
      >
        <boxGeometry args={[0.8, 1, 0.8]} />
        <MeshDistortMaterial 
          color={color} 
          speed={hovered ? 2 : 0} 
          distort={hovered ? 0.2 : 0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Base reflection */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      <Text position={[0, -0.4, 0]} fontSize={0.18} color="#a0a0b8" anchorY="top">
        {label}
      </Text>
      
      {hovered && (
        <Text position={[0, height + 0.5, 0]} fontSize={0.25} color="white" fontWeight="bold">
          {value}
        </Text>
      )}
    </group>
  );
}

function FloatingParticles() {
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.002;
    }
  });

  const particles = React.useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    position: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 8],
    size: Math.random() * 0.04 + 0.01,
  })), []);

  return (
    <group ref={particlesRef}>
      {particles.map((p, i) => (
        <Float key={i} speed={2} floatIntensity={1}>
          <mesh position={p.position}>
            <sphereGeometry args={[p.size]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Platform3DChart({ platforms }) {
  const platformConfig = {
    youtube: { color: '#FF0000', label: 'YouTube' },
    instagram: { color: '#E1306C', label: 'Instagram' },
    tiktok: { color: '#00F2EA', label: 'TikTok' },
    twitter: { color: '#1DA1F2', label: 'Twitter' },
  };

  const maxFollowers = Math.max(...(platforms || []).map((p) => p.followers || 0), 1);

  return (
    <div className="card" style={{ height: 450, marginTop: 24, position: 'relative' }}>
      <h3 style={{ fontSize: 18, marginBottom: 8, position: 'absolute', top: 24, left: 32, zIndex: 10 }}>
        Platform Distribution
      </h3>
      <Canvas camera={{ position: [5, 4, 6], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, -5]} angle={0.3} penumbra={1} intensity={1} color="#E1306C" />
        
        <FloatingParticles />
        
        <group position={[0, -1, 0]}>
            {(platforms || []).map((p, i) => {
            const config = platformConfig[p.platform] || { color: '#fff', label: p.platform };
            const normalizedHeight = ((p.followers || 0) / maxFollowers) * 3 + 0.5;
            const xPos = (i - (platforms.length - 1) / 2) * 1.8;

            return (
                <PlatformBar
                key={p.platform}
                position={[xPos, 0, 0]}
                height={normalizedHeight}
                color={config.color}
                label={config.label}
                value={`${((p.followers || 0) / 1000).toFixed(1)}K`}
                />
            );
            })}
        </group>

        <gridHelper args={[20, 20, '#222240', '#1a1a2e']} position={[0, -1, 0]} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
