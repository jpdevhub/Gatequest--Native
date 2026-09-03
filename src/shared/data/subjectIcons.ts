import {
    AppWindow, Bicycle, Binary, Books, Brain, Broadcast, Browsers, Calculator, Circuitry, Code,
    Cpu, Database, Empty, Engine, Factory, FileCode, Flame, Gauge, GitBranch, Globe, Graph,
    HeadCircuit, Lightbulb, LinuxLogo, Magnet, Pi, PlugCharging, Power, Pulse, Sliders,
    TerminalWindow, TreeStructure, Waveform, WaveSine, Waves, Wrench,
} from 'phosphor-react-native';
import type React from 'react';

/** Mirrors the PWA's SubjectIconMap so both apps show the same icon per subject. */
export const SubjectIconMap: Record<string, React.ElementType> = {
    pi: Pi, binary: Binary, cpu: Cpu, graph: Graph, gitbranch: GitBranch,
    filecode: FileCode, calculator: Calculator, linuxlogo: LinuxLogo, code: Code,
    database: Database, globe: Globe, 'tree-structure': TreeStructure, bicycle: Bicycle,
    brain: Brain, terminal: TerminalWindow, flame: Flame, zap: Lightbulb,
    appwindow: AppWindow, browsers: Browsers, headcircuit: HeadCircuit, pulse: Pulse,
    wavesine: WaveSine, sliders: Sliders, broadcast: Broadcast, magnet: Magnet,
    gauge: Gauge, plugcharging: PlugCharging, power: Power, waveform: Waveform,
    wrench: Wrench, waves: Waves, factory: Factory,
    empty: Empty, circuitry: Circuitry, engine: Engine,
    // `wavesign` is how this dataset spells the sine-wave icon.
    wavesign: WaveSine,
    default: Books,
};

export const getSubjectIcon = (name?: string | null): React.ElementType =>
    SubjectIconMap[name ?? 'default'] ?? SubjectIconMap.default!;

export type SubjectIconProps = {
    name?: string | null;
    size?: number;
    color?: string;
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
};

/** Native equivalents of the PWA's Tailwind subject colour classes. */
export const SubjectColorMap: Record<string, { bg: string; fg: string }> = {
    blue: { bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa' },
    green: { bg: 'rgba(34,197,94,0.15)', fg: '#4ade80' },
    purple: { bg: 'rgba(168,85,247,0.15)', fg: '#c084fc' },
    orange: { bg: 'rgba(249,115,22,0.15)', fg: '#fb923c' },
    red: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171' },
    yellow: { bg: 'rgba(234,179,8,0.15)', fg: '#facc15' },
    cyan: { bg: 'rgba(6,182,212,0.15)', fg: '#22d3ee' },
    pink: { bg: 'rgba(236,72,153,0.15)', fg: '#f472b6' },
    indigo: { bg: 'rgba(99,102,241,0.15)', fg: '#818cf8' },
    lime: { bg: 'rgba(132,204,22,0.15)', fg: '#a3e635' },
    emerald: { bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
    teal: { bg: 'rgba(20,184,166,0.15)', fg: '#2dd4bf' },
    sky: { bg: 'rgba(14,165,233,0.15)', fg: '#38bdf8' },
    violet: { bg: 'rgba(139,92,246,0.15)', fg: '#a78bfa' },
    fuchsia: { bg: 'rgba(217,70,239,0.15)', fg: '#e879f9' },
    rose: { bg: 'rgba(244,63,94,0.15)', fg: '#fb7185' },
    amber: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24' },
    slate: { bg: 'rgba(100,116,139,0.15)', fg: '#94a3b8' },
    zinc: { bg: 'rgba(113,113,122,0.15)', fg: '#a1a1aa' },
    turquoise: { bg: 'rgba(20,184,166,0.18)', fg: '#5eead4' },
    brown: { bg: 'rgba(180,83,9,0.18)', fg: '#fcd34d' },
    black: { bg: 'rgba(255,255,255,0.08)', fg: '#e2e8f0' },
    gray: { bg: 'rgba(100,116,139,0.15)', fg: '#94a3b8' },
};

export const getSubjectColors = (color?: string | null) =>
    SubjectColorMap[color ?? 'gray'] ?? SubjectColorMap.gray!;
