"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  CameraControls,
  Environment,
  ContactShadows,
  KeyboardControls,
  useGLTF,
  axesHelper,
  useKeyboardControls,
} from "@react-three/drei";


const PRIZES = [
  { name: "熊熊娃娃", icon: "🧸" },
  { name: "棒棒糖", icon: "🍭" },
  { name: "小鴨鴨", icon: "🦆" },
];
const FAIL = { name: "沒抓到", icon: "💦" };

function ClawModel({ clawPos, targetY, setClawPos }) {
  const { scene } = useGLTF("/claw.glb");
  const clawRef = useRef();

  useFrame(() => {
    if (Math.abs(clawPos.y - targetY) > 0.01) {
      const newY = clawPos.y + (targetY - clawPos.y) * 0.05;
      setClawPos((pos) => ({ ...pos, y: newY }));
    } else if (clawPos.y !== targetY) {
      setClawPos((pos) => ({ ...pos, y: targetY }));
    }
    if (!clawRef.current) return;
    clawRef.current.traverse((child) => {
      switch (child.name) {
        case "claw":
          child.position.set(clawPos.x, clawPos.y + 2.85, clawPos.z);
          break;
        case "clawBase":
          child.position.set(clawPos.x, 2.85, clawPos.z);
          break;
        case "track":
          child.position.set(0, 2.85, clawPos.z);
          break;
      }
    });
  });

  return <primitive ref={clawRef} object={scene} scale={1.3} />;
}

function ClawCamera({ clawPos, setClawPos }) {
  const [, getKeys] = useKeyboardControls();
  useFrame(() => {
    const keys = getKeys();
    let { x, y, z } = clawPos;
    let moved = false;
    if (keys.forward)  { z -= 0.05; moved = true; }
    if (keys.backward) { z += 0.05; moved = true; }
    if (keys.left)     { x -= 0.05; moved = true; }
    if (keys.right)    { x += 0.05; moved = true; }
    x = Math.max(-0.7, Math.min(0.7, x));
    z = Math.max(-0.7, Math.min(0.4, z));
    if (moved) setClawPos({ x, y, z });
  });
  return null;
}

function Popup({ prize }) {
  if (!prize) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="bg-black/70 text-white px-8 py-6 rounded-lg text-xl shadow-lg flex flex-col items-center">
        <span style={{ fontSize: 48 }}>{prize.icon}</span>
        <span className="mt-2">{prize.name}</span>
      </div>
    </div>
  );
}

export function Instructions() {
  const [open, setOpen] = useState(true);

  return (
    <div className="absolute top-6 right-6 z-50">
      <div className="w-full min-w-[270px] shadow-lg">
        <button
          onClick={() => setOpen(o => !o)}
          className={`
            w-full flex items-center gap-2 px-4 py-2
            bg-white/95 font-bold text-base
            rounded-t-2xl
            ${open ? "" : "rounded-b-2xl"}
            border-b border-gray-200
            transition-all
          `}
          style={{
            boxShadow: open ? "0 4px 24px #a89bf744" : "0 2px 12px #a89bf733"
          }}
        >
          <span className="text-xl mr-1">🎮</span>
          遊戲玩法
          <span className="ml-auto text-xl select-none">{open ? "▲" : "▼"}</span>
        </button>
        <div
          className={`
            bg-white/95
            rounded-b-2xl
            overflow-hidden transition-all duration-400
            ${open ? "max-h-96 py-4 px-6 opacity-100" : "max-h-0 py-0 px-6 opacity-0"}
            border-t-0
          `}
          style={{
            backdropFilter: "blur(4px)",
            transition: "all .5s cubic-bezier(.4,0,.2,1)"
          }}
        >
          <ul className="space-y-3 font-medium text-gray-700 text-base">
            <li><span className="inline-block w-5 text-pink-500">•</span>使用 <b>W/A/S/D</b> 或方向鍵移動爪子</li>
            <li><span className="inline-block w-5 text-pink-500">•</span>按 <b>Space</b> 下降抓娃娃</li>
            <li><span className="inline-block w-5 text-pink-500">•</span>隨機獲得三種獎品 <span className="ml-2 text-lg">🧸🍭🦆</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [clawPos, setClawPos] = useState({ x: 0, y: 0, z: 0 });
  const [targetY, setTargetY] = useState(0);
  const [isClawMoving, setIsClawMoving] = useState(false);
  const [popupPrize, setPopupPrize] = useState(null);

  const movingRef = useRef(false);
  useEffect(() => { movingRef.current = isClawMoving; }, [isClawMoving]);

  const getRandomPrize = () => {
    const r = Math.random();
    if (r < 0.4) return FAIL;
    if (r < 0.6) return PRIZES[0];
    if (r < 0.8) return PRIZES[1];
    return PRIZES[2];
  };

  const handleGrab = () => {
    if (movingRef.current) return;
    setIsClawMoving(true);
    setTargetY(-1);
    setTimeout(() => {
      setTargetY(0);
      setTimeout(() => {
        setIsClawMoving(false);
        setPopupPrize(getRandomPrize());
      }, 1500);
    }, 1500);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && !movingRef.current) {
        e.preventDefault();
        handleGrab();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!popupPrize) return;
    const t = setTimeout(() => setPopupPrize(null), 2000);
    return () => clearTimeout(t);
  }, [popupPrize]);

  return (
    <div
      className="w-full h-screen relative bg-center bg-cover"
      style={{ backgroundImage: "url('/arcade-bg.png')" }}

      
    >
      <Popup prize={popupPrize} />
      <Instructions />

      <KeyboardControls map={[
        { name: "forward", keys: ["ArrowUp","w","W"] },
        { name: "backward",keys: ["ArrowDown","s","S"] },
        { name: "left",    keys: ["ArrowLeft","a","A"] },
        { name: "right",   keys: ["ArrowRight","d","D"] },
        { name: "jump",    keys: ["Space"] },
      ]}>
        <Canvas
          className="absolute inset-0"
          gl={{ alpha: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <ambientLight intensity={Math.PI/2} />
          <spotLight position={[10,10,10]} angle={0.15} penumbra={1} intensity={Math.PI} />
          <pointLight position={[-10,-10,-10]} intensity={Math.PI} />

          <group position={[0.1, -2.5, -1]}> 
            <Suspense fallback={null}>
              <ClawModel clawPos={clawPos} targetY={targetY} setClawPos={setClawPos} />
            </Suspense>
          </group>

          <Environment background={false} preset="city" />
          <ContactShadows opacity={1} scale={10} blur={10} color="#DDDDDD" />

          <ClawCamera clawPos={clawPos} setClawPos={setClawPos} />
          <CameraControls />
          <axesHelper args={[10]} />
        </Canvas>
      </KeyboardControls>
    </div>
  );
}
