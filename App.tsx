import React, { useState, useCallback } from 'react';
import HoloEarth from './components/HoloEarth';
import HoloUI from './components/HoloUI';
import { getPlanetaryIntel } from './services/geminiService';
import { GeoFact, AppState, Controls, Coordinates, HoverData } from './types';
import { AlertTriangle, Power, Globe, Orbit, MousePointer2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [controls, setControls] = useState<Controls>({ isDragging: false });
  const [currentFact, setCurrentFact] = useState<GeoFact | null>({
    title: "系统就绪",
    content: "全息核心已启动。请拖动地球调整视角，滑动鼠标扫描坐标，点击任意位置获取国家/地理详细情报。",
    coordinates: { lat: 0, lng: 0 }
  });
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  // Optimized callback to reduce re-renders
  const handleControlsUpdate = useCallback((newControls: Controls) => {
    setControls(prev => {
        if (prev.isDragging === newControls.isDragging) return prev;
        return newControls;
    });
  }, []);

  const handleHover = useCallback((data: HoverData | null) => {
      setHoverData(data);
  }, []);

  const handleSystemReady = useCallback(() => {
    setAppState(AppState.READY);
  }, []);

  const handleLocationSelect = async (coords: Coordinates) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    
    // Clear previous fact momentarily or keep it? Keeping it prevents flicker.
    const fact = await getPlanetaryIntel(coords.lat, coords.lng);
    
    setCurrentFact(fact);
    setIsAnalyzing(false);
  };

  if (!isStarted) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-cyan-500 font-mono relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(8,145,178,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        
        <div className="z-10 bg-black/60 p-10 border border-cyan-500/30 rounded-2xl backdrop-blur-lg max-w-lg text-center shadow-[0_0_50px_rgba(6,182,212,0.15)] relative">
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500"></div>
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500"></div>

          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 rounded-full"></div>
            <Globe size={80} className="text-cyan-400 relative z-10" />
          </div>
          
          <h1 className="text-5xl font-bold mb-2 text-white tracking-widest uppercase">
            Holo<span className="text-cyan-400">Earth</span>
          </h1>
          <div className="text-sm tracking-[0.3em] text-cyan-600 mb-8 uppercase">行星级地理信息系统</div>
          
          <p className="mb-8 text-cyan-200/80 leading-relaxed text-sm">
             初始化 V3.2 核心...<br/>
             高精度纹理加载中...<br/>
             Gemini AI 链路连接就绪。
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-left mb-8">
             <div className="bg-cyan-950/30 p-3 rounded border border-cyan-900 flex items-center gap-2">
                <Orbit size={14} className="text-blue-400" />
                <span>3D 矢量网格</span>
             </div>
             <div className="bg-cyan-950/30 p-3 rounded border border-cyan-900 flex items-center gap-2">
                <MousePointer2 size={14} className="text-purple-400" />
                <span>精准坐标扫描</span>
             </div>
          </div>

          <button 
            onClick={() => setIsStarted(true)}
            className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-all w-full overflow-hidden tracking-widest uppercase"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
               <Power size={18} />
               启动系统
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {appState === AppState.ERROR && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 text-red-500 font-mono backdrop-blur-sm">
          <div className="text-center p-8 border border-red-900/50 rounded bg-red-950/10">
             <AlertTriangle size={48} className="mx-auto mb-4 animate-bounce" />
             <h2 className="text-2xl font-bold mb-2 tracking-wider">系统错误</h2>
             <p className="text-red-400/80 mb-6">{errorMessage || "核心初始化失败"}</p>
             <button onClick={() => window.location.reload()} className="border border-red-500 text-red-400 px-6 py-2 hover:bg-red-900/30 transition-colors uppercase text-sm tracking-widest">
               重启终端
             </button>
          </div>
        </div>
      )}

      {/* 3D Earth Layer */}
      <HoloEarth 
        onControlsUpdate={handleControlsUpdate}
        onLocationSelect={handleLocationSelect}
        onHover={handleHover}
        onReady={handleSystemReady}
      />

      {/* HUD Layer */}
      <HoloUI 
        fact={currentFact}
        loading={isAnalyzing}
        controls={controls}
        hoverData={hoverData}
      />
    </div>
  );
};

export default App;