import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Controls, Coordinates, HoverData } from '../types';

interface HoloEarthProps {
  onControlsUpdate: (controls: Controls) => void;
  onLocationSelect: (coords: Coordinates) => void;
  onHover: (data: HoverData | null) => void;
  onReady: () => void;
}

// Helper: Convert Lat/Lng to 3D Vector
// NOTE: This must match the texture mapping.
// Texture (0,0) is at (0,0,1) in local space with this math.
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 90) * (Math.PI / 180); // +90 offset to align with texture

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Helper: Point in Polygon Algorithm (Ray Casting)
const isPointInPolygon = (point: number[], vs: number[][][]) => {
    // point = [lng, lat]
    // vs = array of polygons (GeoJSON structure)
    const x = point[0], y = point[1];
    let inside = false;
    
    // Handle MultiPolygons by flattening simple logic or iterating rings
    // GeoJSON Polygon: [ [ [lng,lat], ... ], [hole] ]
    // We only check the outer ring (index 0) for simplicity in hit testing
    
    for (let i = 0; i < vs.length; i++) {
        const ring = vs[i]; 
        for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) {
            const xi = ring[j][0], yi = ring[j][1];
            const xj = ring[k][0], yj = ring[k][1];
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }
    
    return inside;
};

const HoloEarth: React.FC<HoloEarthProps> = ({ onControlsUpdate, onLocationSelect, onHover, onReady }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const markerRef = useRef<THREE.Mesh | null>(null);
  const bordersGroupRef = useRef<THREE.Group | null>(null);
  const highlightMeshRef = useRef<THREE.LineSegments | null>(null);
  
  // Data State
  const geoJsonData = useRef<any>(null);
  
  // Interaction State
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0.0005 }); 
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const lastReportedDragState = useRef<boolean>(false);
  const lastHoverCheckTime = useRef<number>(0);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => {
        geoJsonData.current = data;
        drawGlobalBorders(data);
      })
      .catch(err => console.error("Failed to load borders:", err));
  }, []);

  const drawGlobalBorders = (data: any) => {
    if (!earthGroupRef.current) return;

    const material = new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.15 });
    const positions: number[] = [];

    data.features.forEach((feature: any) => {
        const geometry = feature.geometry;
        
        const processRing = (ring: number[][]) => {
            for (let i = 0; i < ring.length - 1; i++) {
                const v1 = latLngToVector3(ring[i][1], ring[i][0], 1.002);
                const v2 = latLngToVector3(ring[i+1][1], ring[i+1][0], 1.002);
                positions.push(v1.x, v1.y, v1.z);
                positions.push(v2.x, v2.y, v2.z);
            }
        };

        if (geometry.type === 'Polygon') {
            geometry.coordinates.forEach((ring: number[][]) => processRing(ring));
        } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach((polygon: number[][][]) => {
                polygon.forEach((ring: number[][]) => processRing(ring));
            });
        }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.LineSegments(geometry, material);
    
    // Borders must be added to the Earth Group so they rotate with it
    bordersGroupRef.current = new THREE.Group();
    bordersGroupRef.current.add(lines);
    earthGroupRef.current.add(bordersGroupRef.current);
  };

  const highlightCountry = (feature: any) => {
      if (!earthGroupRef.current) return;
      
      // Remove previous highlight
      if (highlightMeshRef.current) {
          earthGroupRef.current.remove(highlightMeshRef.current);
          highlightMeshRef.current.geometry.dispose();
          highlightMeshRef.current = null;
      }

      if (!feature) return;

      const material = new THREE.LineBasicMaterial({ 
          color: 0xffff00, // Bright Yellow/Gold for selection
          linewidth: 2,
          transparent: true, 
          opacity: 0.8,
          blending: THREE.AdditiveBlending
      });
      
      const positions: number[] = [];

      const processRing = (ring: number[][]) => {
          for (let i = 0; i < ring.length - 1; i++) {
              // Lift it slightly higher than global borders (1.004)
              const v1 = latLngToVector3(ring[i][1], ring[i][0], 1.004);
              const v2 = latLngToVector3(ring[i+1][1], ring[i+1][0], 1.004);
              positions.push(v1.x, v1.y, v1.z);
              positions.push(v2.x, v2.y, v2.z);
          }
      };

      const geometry = feature.geometry;
      if (geometry.type === 'Polygon') {
          geometry.coordinates.forEach((ring: number[][]) => processRing(ring));
      } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((polygon: number[][][]) => {
              polygon.forEach((ring: number[][]) => processRing(ring));
          });
      }

      const buffGeo = new THREE.BufferGeometry();
      buffGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mesh = new THREE.LineSegments(buffGeo, material);
      
      highlightMeshRef.current = mesh;
      earthGroupRef.current.add(mesh);
  };

  useEffect(() => {
    let requestID: number;
    const mountNode = mountRef.current;

    const init = async () => {
      if (!mountNode) return;

      const width = mountNode.clientWidth;
      const height = mountNode.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      
      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 2.5; 
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        powerPreference: "high-performance" 
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      mountNode.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Group
      const earthGroup = new THREE.Group();
      earthGroupRef.current = earthGroup;
      scene.add(earthGroup);

      // Textures
      const textureLoader = new THREE.TextureLoader();
      const earthMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
      const earthSpecular = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg');
      const earthNormal = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');

      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      earthMap.anisotropy = maxAnisotropy;
      earthNormal.anisotropy = maxAnisotropy;
      earthSpecular.anisotropy = maxAnisotropy;

      // Geometry & Material
      // Geometry is rotated -90 deg Y to align Prime Meridian with Z axis in latLngToVector3 logic
      const geometry = new THREE.SphereGeometry(1, 128, 128); 
      geometry.rotateY(-Math.PI / 2); 

      const material = new THREE.MeshStandardMaterial({
        map: earthMap,
        normalMap: earthNormal,
        roughnessMap: earthSpecular,
        roughness: 0.5,
        metalness: 0.1,
        color: 0xffffff,
      });

      const earth = new THREE.Mesh(geometry, material);
      earthMeshRef.current = earth;
      earthGroup.add(earth);

      // Grid Overlay
      const gridGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(1.001, 36, 36));
      gridGeo.rotateY(-Math.PI / 2);
      const gridMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.08 });
      const grid = new THREE.LineSegments(gridGeo, gridMat);
      earthGroup.add(grid);

      // Cursor
      const cursorGeo = new THREE.RingGeometry(0.02, 0.03, 32);
      const cursorMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const cursor = new THREE.Mesh(cursorGeo, cursorMat);
      cursor.visible = false;
      cursorRef.current = cursor;
      earthGroup.add(cursor);

      // Marker
      const markerGeo = new THREE.SphereGeometry(0.01, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.visible = false;
      markerRef.current = marker;
      earthGroup.add(marker);
      
      const markerGlowGeo = new THREE.RingGeometry(0.015, 0.03, 32);
      const markerGlowMat = new THREE.MeshBasicMaterial({ color: 0xff3366, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
      const markerGlow = new THREE.Mesh(markerGlowGeo, markerGlowMat);
      marker.add(markerGlow);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);
      const spotLight = new THREE.SpotLight(0x00ccff, 3);
      spotLight.position.set(-5, 0, -2);
      spotLight.lookAt(0,0,0);
      scene.add(spotLight);

      // Stars
      const starGeo = new THREE.BufferGeometry();
      const starCount = 1500;
      const starPos = new Float32Array(starCount * 3);
      for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 20; 
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.015, transparent: true, opacity: 0.6});
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      onReady();

      const animate = () => {
        if (!earthGroupRef.current) return;

        // Inertia
        if (!isDragging.current) {
           rotationVelocity.current.x *= 0.95;
           rotationVelocity.current.y *= 0.95;
           if (Math.abs(rotationVelocity.current.y) < 0.00005) rotationVelocity.current.y = 0.00005; 
        }

        earthGroupRef.current.rotation.y += rotationVelocity.current.y;
        earthGroupRef.current.rotation.x += rotationVelocity.current.x;
        earthGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, earthGroupRef.current.rotation.x));

        // Sync Matrix for accurate raycasting next frame
        earthGroupRef.current.updateMatrixWorld();

        // Cursor Anim
        if (cursorRef.current && cursorRef.current.visible) {
             cursorRef.current.lookAt(camera.position);
             cursorRef.current.rotation.z -= 0.02;
        }
        // Marker Anim
        if (markerRef.current?.visible) {
             const scale = 1 + Math.sin(Date.now() * 0.008) * 0.3;
             markerRef.current.children[0].scale.set(scale, scale, 1);
             markerRef.current.children[0].lookAt(camera.position);
        }

        if (isDragging.current !== lastReportedDragState.current) {
            onControlsUpdate({ isDragging: isDragging.current });
            lastReportedDragState.current = isDragging.current;
        }

        renderer.render(scene, camera);
        requestID = requestAnimationFrame(animate);
      };

      animate();
    };

    init();

    return () => {
      cancelAnimationFrame(requestID);
      if (rendererRef.current && mountNode) {
         mountNode.removeChild(rendererRef.current.domElement);
         rendererRef.current.dispose();
      }
    };
  }, [onControlsUpdate, onReady]);

  // Coordinate Calculation
  const calculateCoords = (point: THREE.Vector3) => {
      if (!earthGroupRef.current) return null;
      
      // Get point in Mesh/Group Local Space
      // Since geometry is rotated -90 Y, this gives us coordinates relative to the rotated space.
      const localPoint = earthGroupRef.current.worldToLocal(point.clone()).normalize();

      // Calculation must be the strict inverse of latLngToVector3 to match borders.
      // latLngToVector3 logic:
      // x = -sin(phi)cos(theta)
      // z = sin(phi)sin(theta)
      // theta = lng + 90
      
      // Inverse:
      // lat = asin(y)
      // tan(theta) = z / -x
      // theta = atan2(z, -x)
      // lng = theta - 90
      
      const lat = Math.asin(localPoint.y) * (180 / Math.PI);
      let lng = (Math.atan2(localPoint.z, -localPoint.x) * (180 / Math.PI)) - 90;

      // Normalize longitude to -180 to 180
      if (lng < -180) lng += 360;
      if (lng > 180) lng -= 360;

      return {
          lat: Math.round(lat * 100) / 100,
          lng: Math.round(lng * 100) / 100
      };
  };

  const getIntersections = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent | WheelEvent) => {
      if (!mountRef.current || !cameraRef.current || !earthMeshRef.current) return null;

      let clientX, clientY;
      if ('changedTouches' in e) {
          const touches = (e as any).changedTouches;
          clientX = touches[0].clientX;
          clientY = touches[0].clientY;
      } else if ('touches' in e && (e as any).touches.length > 0) {
           const touches = (e as any).touches;
           clientX = touches[0].clientX;
           clientY = touches[0].clientY;
      } else {
          const evt = e as React.MouseEvent;
          clientX = evt.clientX;
          clientY = evt.clientY;
      }
      
      if (clientX === undefined || clientY === undefined) return null;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      return raycaster.current.intersectObject(earthMeshRef.current);
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (!cameraRef.current) return;
      const zoomSpeed = 0.0015;
      const minDistance = 1.25; 
      const maxDistance = 5.0; 
      let newZ = cameraRef.current.position.z + e.deltaY * zoomSpeed;
      newZ = Math.max(minDistance, Math.min(maxDistance, newZ));
      cameraRef.current.position.z = newZ;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    rotationVelocity.current = { x: 0, y: 0 };
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    previousMousePosition.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging.current && earthGroupRef.current) {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const deltaX = clientX - previousMousePosition.current.x;
        const deltaY = clientY - previousMousePosition.current.y;

        rotationVelocity.current = {
            x: deltaY * 0.003,
            y: deltaX * 0.003
        };

        earthGroupRef.current.rotation.y += rotationVelocity.current.y;
        earthGroupRef.current.rotation.x += rotationVelocity.current.x;
        previousMousePosition.current = { x: clientX, y: clientY };
        return; 
    }

    // Hover
    const intersections = getIntersections(e);
    if (intersections && intersections.length > 0) {
        const point = intersections[0].point;
        if (earthMeshRef.current && cursorRef.current && earthGroupRef.current) {
            
            const groupLocalPoint = earthGroupRef.current.worldToLocal(point.clone());
            cursorRef.current.position.copy(groupLocalPoint);
            cursorRef.current.visible = true;

            const now = Date.now();
            // Throttle geo-calculations to 100ms to save performance
            if (now - lastHoverCheckTime.current > 100) {
                const coords = calculateCoords(point);
                if (coords) {
                    let matchedCountryName: string | undefined = undefined;
                    
                    // Check against GeoJSON
                    if (geoJsonData.current) {
                        for (const feature of geoJsonData.current.features) {
                             const geometry = feature.geometry;
                             let isMatch = false;
                             
                             if (geometry.type === 'Polygon') {
                                 isMatch = isPointInPolygon([coords.lng, coords.lat], geometry.coordinates);
                             } else if (geometry.type === 'MultiPolygon') {
                                 // Check each polygon in the multipolygon
                                 for (const polygon of geometry.coordinates) {
                                     if (isPointInPolygon([coords.lng, coords.lat], polygon)) {
                                         isMatch = true;
                                         break;
                                     }
                                 }
                             }

                             if (isMatch) {
                                 matchedCountryName = feature.properties.name;
                                 highlightCountry(feature);
                                 break; 
                             }
                        }
                        
                        // If no match found, clear highlight
                        if (!matchedCountryName) {
                            highlightCountry(null);
                        }
                    }

                    onHover({ coords, country: matchedCountryName });
                }
                lastHoverCheckTime.current = now;
            }
        }
    } else {
        if (cursorRef.current) cursorRef.current.visible = false;
        highlightCountry(null); // Clear highlight on mouse leave
        onHover(null);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
      if (Math.abs(rotationVelocity.current.x) > 0.002 || Math.abs(rotationVelocity.current.y) > 0.002) {
          return;
      }

      const intersections = getIntersections(e);

      if (intersections && intersections.length > 0) {
          const point = intersections[0].point;
          
          if (earthGroupRef.current && markerRef.current) {
               const groupLocalPoint = earthGroupRef.current.worldToLocal(point.clone());
               markerRef.current.position.copy(groupLocalPoint);
               markerRef.current.visible = true;

               const coords = calculateCoords(point);
               if (coords) onLocationSelect(coords);
          }
      }
  };

  return (
    <div 
        ref={mountRef} 
        className="w-full h-full cursor-crosshair active:cursor-grabbing"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => { handlePointerUp(); onHover(null); }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onClick={handleClick}
        onWheel={handleWheel}
    />
  );
};

export default HoloEarth;