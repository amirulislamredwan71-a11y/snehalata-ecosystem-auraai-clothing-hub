import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_POSITIONS = new Float32Array(3000 * 3);
for (let i = 0; i < 3000; i++) {
  const theta = 2 * Math.PI * Math.random();
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 1.2 + Math.random() * 0.5;
  PARTICLE_POSITIONS[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  PARTICLE_POSITIONS[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  PARTICLE_POSITIONS[i * 3 + 2] = r * Math.cos(phi);
}

function ParticleField() {
  const ref = useRef<any>(null);
  
  const positions = useMemo(() => PARTICLE_POSITIONS, []);

  useFrame((state: any) => {
    if (ref.current) {
      const pointerX = state.pointer?.x ?? state.mouse?.x ?? 0;
      const pointerY = state.pointer?.y ?? state.mouse?.y ?? 0;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05 + pointerX * 0.1;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.03 + pointerY * 0.1;
    }
  });

  return (
    <points ref={ref} rotation={[0, 0, Math.PI / 4]}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          args={[positions, 3]}
          count={3000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#7c3aed"
        size={0.006}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function AuraBlob() {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame((state: any) => {
    if (mesh.current) {
      const pointerX = state.pointer?.x ?? state.mouse?.x ?? 0;
      const pointerY = state.pointer?.y ?? state.mouse?.y ?? 0;
      mesh.current.rotation.z = state.clock.getElapsedTime() * 0.1;
      mesh.current.position.x = pointerX * 0.5;
      mesh.current.position.y = pointerY * 0.5;
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
      mesh.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh ref={mesh} position={[0, 0, -2]}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial 
        color="#1e1b4b" 
        emissive="#7c3aed" 
        emissiveIntensity={0.5}
        wireframe
        transparent
        opacity={0.1}
      />
    </mesh>
  );
}

export const NeuralBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ParticleField />
          <AuraBlob />
        </Suspense>
      </Canvas>
    </div>
  );
};

