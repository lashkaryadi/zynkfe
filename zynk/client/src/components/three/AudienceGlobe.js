import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

function Globe() {
  const globeRef = useRef();

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={globeRef}>
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#1a1a2e"
          wireframe
          transparent
          opacity={0.15}
        />
      </Sphere>
      <Sphere args={[1.99, 64, 64]}>
        <meshStandardMaterial
          color="#DD2A7B"
          transparent
          opacity={0.05}
        />
      </Sphere>
    </group>
  );
}

function AudienceDot({ lat, lng, size, color, label, count }) {
  const position = useMemo(() => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -2.05 * Math.sin(phi) * Math.cos(theta);
    const y = 2.05 * Math.cos(phi);
    const z = 2.05 * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  }, [lat, lng]);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// Major world locations for demo
const defaultLocations = [
  { lat: 40.7, lng: -74, label: 'US', size: 0.1, color: '#F58529' },
  { lat: 51.5, lng: -0.1, label: 'UK', size: 0.07, color: '#DD2A7B' },
  { lat: 20.5, lng: 78.9, label: 'India', size: 0.09, color: '#8134AF' },
  { lat: 35.6, lng: 139.6, label: 'Japan', size: 0.06, color: '#00F2EA' },
  { lat: -33.8, lng: 151.2, label: 'Australia', size: 0.05, color: '#1DA1F2' },
  { lat: -23.5, lng: -46.6, label: 'Brazil', size: 0.07, color: '#F58529' },
  { lat: 55.7, lng: 37.6, label: 'Russia', size: 0.05, color: '#DD2A7B' },
  { lat: 1.3, lng: 103.8, label: 'Singapore', size: 0.04, color: '#00F2EA' },
];

export default function AudienceGlobe({ locations }) {
  const dots = locations || defaultLocations;

  return (
    <div className="card" style={{ height: 500, marginTop: 32, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: 20, padding: '24px 32px 0', zIndex: 10 }}>
        Audience Distribution
      </h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[15, 15, 15]} intensity={1} color="#FAA307" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#9D4EDD" />
            
            <Globe />
            {dots.map((loc, i) => (
            <AudienceDot key={i} {...loc} />
            ))}

            <OrbitControls 
            enableZoom={false} 
            autoRotate 
            autoRotateSpeed={0.5} 
            enablePan={false}
            />
        </Canvas>
      </div>
    </div>
  );
}
