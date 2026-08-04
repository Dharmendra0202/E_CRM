import React, { useState, useRef } from "react";
import {
  LayoutGrid, X, Award, Settings, MessageSquare, Sparkles
} from "lucide-react";

interface AppsMenuDrawerProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export function AppsMenuDrawer({ onNavigate, currentView }: AppsMenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close only when clicking outside or clicking the trigger icon again
  const handleToggle = () => setIsOpen((prev) => !prev);

  // Close when clicking outside the menu
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    // Delay adding listener so the current click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Dedicated separate modules with vibrant tailored gradient colors
  const separateActions = [
    {
      id: "exams",
      name: "Exams & Report Cards",
      icon: Award,
      badge: "NEW",
      gradient: "from-pink-500 via-rose-500 to-rose-600",
      shadow: "shadow-pink-500/35",
      ring: "ring-pink-400/40",
    },
    {
      id: "settings",
      name: "CRM Settings",
      icon: Settings,
      badge: "CORE",
      gradient: "from-purple-600 via-indigo-600 to-violet-700",
      shadow: "shadow-purple-500/35",
      ring: "ring-purple-400/40",
    },
    {
      id: "whatsapp",
      name: "WhatsApp AI Bot",
      icon: MessageSquare,
      badge: "AI",
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      shadow: "shadow-emerald-500/35",
      ring: "ring-emerald-400/40",
    },
  ];

  const total = separateActions.length;
  const itemGap = 56;     // Horizontal spacing between icon centers
  const midIndex = (total - 1) / 2; // Center index (1 for 3 items)
  const maxDepth = 16;    // U-curve depth dip (px)

  return (
    <div
      ref={containerRef}
      className="relative inline-block z-[99999]"
    >
      {/* ── Main Trigger Circle Button (Vibrant Magenta-Purple Gradient) ── */}
      <button
        onClick={handleToggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer text-white shadow-lg ${
          isOpen
            ? "bg-gradient-to-r from-[hsl(328,100%,50%)] to-[hsl(271,91%,55%)] scale-110 shadow-pink-500/50 ring-4 ring-pink-500/30"
            : "bg-gradient-to-r from-[hsl(328,100%,54%)] to-[hsl(271,91%,60%)] hover:scale-108 hover:shadow-pink-500/40"
        }`}
        title="Quick Modules"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={18} className="transition-transform duration-300 rotate-90 text-white" />
        ) : (
          <LayoutGrid size={18} className="text-white" />
        )}
      </button>

      {/* ── Vibrant Floating Circular Action Icons Centered Directly Below Menu Button ── */}
      {isOpen && (
        <div
          className="absolute top-full left-0 pointer-events-auto"
          style={{ width: "100%", height: "90px" }}
        >
          {separateActions.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            // Offset multiplier relative to center index
            const offsetMult = index - midIndex;
            
            // X Center position relative to trigger button center (20px)
            const leftPx = 20 + offsetMult * itemGap - 22;
            
            // Y position (U-Shape curve parabola dip: center item dips lowest)
            const normDist = midIndex > 0 ? Math.abs(offsetMult) / midIndex : 0;
            const topPx = 12 + (1 - normDist * normDist) * maxDepth;

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  animationDelay: `${index * 45}ms`,
                }}
                className="group flex flex-col items-center animate-in fade-in zoom-in-75 duration-200"
              >
                {/* Tooltip Label Below Floating Circle Icon */}
                <div className="absolute top-full mt-2.5 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-1 group-hover:translate-y-0 z-50">
                  <span className="bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md flex items-center gap-1.5">
                    {item.name}
                    {item.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-pink-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </div>

                {/* Vibrant Gradient Circular Button */}
                <button
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 cursor-pointer active:scale-95 group-hover:scale-115 ${
                    isActive
                      ? `bg-gradient-to-tr ${item.gradient} ring-4 ${item.ring} ${item.shadow} scale-105`
                      : `bg-gradient-to-tr ${item.gradient} ${item.shadow} hover:ring-4 ${item.ring}`
                  }`}
                  aria-label={item.name}
                >
                  <Icon size={19} className="text-white drop-shadow-sm" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
