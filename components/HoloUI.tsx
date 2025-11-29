import React from 'react';
import { Scan, Activity, Loader2, MousePointer2, MapPin, Globe, Target } from 'lucide-react';
import { GeoFact, Controls, HoverData } from '../types';

interface HoloUIProps {
  fact: GeoFact | null;
  loading: boolean;
  controls: Controls;
  hoverData: HoverData | null;
}

const HoloUI: React.FC<HoloUIProps> = ({ fact, loading, controls, hoverData }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between overflow-hidden">
      
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
             <Globe className="text-cyan-400 animate-pulse" size={32} />
             <h1 className="text-3xl font-bold text-cyan-400 tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>
                全息地球
             </h1>
          </div>
          <div className="text-cyan-700/80 text-xs font-mono mt-1 tracking-wider">
             PLANETARY INTERFACE // V3.2 [CLEAR-VIEW]
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1 rounded border backdrop-blur-sm transition-colors duration-300 font-mono text-xs flex items-center gap-2 ${
                controls.isDragging 
                ? "bg-cyan-900/40 border-cyan-500 text-cyan-200" 
                : "bg-black/40 border-cyan-900 text-cyan-700"
            }`}>
                <Activity size={12} className={controls.isDragging ? "animate-spin" : ""} />
                <span>{controls.isDragging ? "姿态调整中..." : "系统待机"}</span>
            </div>
            
            {/* Real-time Hover Coords & Country */}
            <div className={`transition-opacity duration-300 ${hoverData ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-black/60 border border-cyan-500/50 px-3 py-2 rounded text-xs font-mono text-cyan-400 flex flex-col gap-1 w-48 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <div className="flex items-center gap-2 border-b border-cyan-800/50 pb-1 mb-1">
                        <Target size={12} />
                        <span className="font-bold">扫描中...</span>
                    </div>
                    {hoverData?.country && (
                        <div className="mb-1 pb-1 border-b border-cyan-900/50 text-yellow-300 font-bold tracking-wider uppercase text-center animate-pulse">
                            {hoverData.country}
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-cyan-600">LAT:</span>
                        <span>{hoverData?.coords.lat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-cyan-600">LNG:</span>
                        <span>{hoverData?.coords.lng.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Center Reticle - Cosmetic */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-10">
         <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
         <div className="absolute left-0 top-1/2 w-full h-[1px] bg-cyan-500/20" />
         <div className="absolute top-0 left-1/2 h-full w-[1px] bg-cyan-500/20" />
      </div>

      {/* Bottom Information Panel */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 w-full">
        
        {/* Detail Card */}
        <div className="w-full md:max-w-md pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border-t-2 border-cyan-500 p-6 rounded-b-lg shadow-[0_10px_40px_rgba(8,145,178,0.2)] relative overflow-hidden group">
                
                {/* Scan Light Effect */}
                {loading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent w-full h-full animate-[shimmer_2s_infinite]" />
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-6 text-cyan-400 gap-3">
                        <Loader2 className="animate-spin" size={32} />
                        <span className="font-mono text-sm tracking-wider animate-pulse">正在解析地理数据...</span>
                    </div>
                ) : fact ? (
                    <div className="relative z-10 animate-[fadeIn_0.5s_ease-out]">
                        <div className="flex items-center gap-2 mb-3 border-b border-cyan-800/50 pb-2">
                            <Scan size={18} className="text-cyan-400" />
                            <h2 className="text-xl text-cyan-100 font-bold tracking-wide">{fact.title}</h2>
                        </div>
                        <p className="text-cyan-300/80 text-sm leading-relaxed text-justify mb-4 min-h-[60px]">
                            {fact.content}
                        </p>
                        {fact.coordinates && (
                            <div className="flex items-center justify-between text-xs font-mono text-cyan-600 bg-cyan-950/20 p-2 rounded border border-cyan-900/30">
                                <div className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    <span>定位确认</span>
                                </div>
                                <span>LAT: {fact.coordinates.lat.toFixed(2)} / LNG: {fact.coordinates.lng.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-4 text-center text-cyan-700 font-mono text-sm">
                        点击地球表面任意位置进行分析
                    </div>
                )}
            </div>
        </div>

        {/* Controls Hint */}
        <div className="hidden md:flex flex-col items-end gap-2 text-cyan-800 font-mono text-xs">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/30">
                <span>旋转视角</span>
                <MousePointer2 size={12} />
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-900/30">
                <span>选择区域</span>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
            </div>
        </div>

      </div>
    </div>
  );
};

export default HoloUI;