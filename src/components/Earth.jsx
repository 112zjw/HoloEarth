import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

function Earth() {
  const earthRef = useRef()

  // Rotate the earth slowly
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001
    }
  })

  return (
    <Sphere ref={earthRef} args={[1, 64, 64]}>
      <meshStandardMaterial
        color="#4a90e2"
        roughness={0.7}
        metalness={0.2}
        emissive="#1a4d7a"
        emissiveIntensity={0.1}
      />
    </Sphere>
  )
}

export default Earth
