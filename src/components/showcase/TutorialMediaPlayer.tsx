"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    RotateCcw,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Maximize2,
    Minimize2,
    ArrowRight
} from "lucide-react";
import { TUTORIAL_CHAPTERS, TOTAL_TUTORIAL_DURATION } from "@/lib/tutorialData";
import { TutorialChapter } from "@/lib/types/tutorial";
import { cn } from "@/lib/utils";

interface TutorialMediaPlayerProps {
    chapters?: TutorialChapter[];
    totalDuration?: number;
    initialAutoPlay?: boolean;
    className?: string;
}

export default function TutorialMediaPlayer({
    chapters = TUTORIAL_CHAPTERS,
    totalDuration = TOTAL_TUTORIAL_DURATION,
    initialAutoPlay = false,
    className
}: TutorialMediaPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(initialAutoPlay);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const playerContainerRef = useRef<HTMLDivElement>(null);
    const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Identify active chapter based on currentTime
    const activeChapterIndex = React.useMemo(() => {
        for (let i = chapters.length - 1; i >= 0; i--) {
            if (currentTime >= chapters[i].startSecond) {
                return i;
            }
        }
        return 0;
    }, [currentTime, chapters]);

    const activeChapter = chapters[activeChapterIndex] || chapters[0];

    // Timer loop for playback
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime((prev) => {
                    const next = prev + 0.25 * playbackSpeed;
                    if (next >= totalDuration) {
                        return 0; // loop back to beginning
                    }
                    return Math.min(next, totalDuration);
                });
            }, 250);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying, playbackSpeed, totalDuration]);

    // Handle play/pause toggle
    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    // Handle seek to specific time
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        setCurrentTime(percentage * totalDuration);
    };

    // Jump to specific chapter
    const jumpToChapter = (chapterIndex: number) => {
        const targetChapter = chapters[chapterIndex];
        if (targetChapter) {
            setCurrentTime(targetChapter.startSecond);
        }
    };

    const handlePrevChapter = () => {
        if (activeChapterIndex > 0) {
            jumpToChapter(activeChapterIndex - 1);
        } else {
            setCurrentTime(0);
        }
    };

    const handleNextChapter = () => {
        if (activeChapterIndex < chapters.length - 1) {
            jumpToChapter(activeChapterIndex + 1);
        } else {
            setCurrentTime(0);
        }
    };

    const handleReset = () => {
        setCurrentTime(0);
        setIsPlaying(true);
    };

    // Fullscreen toggle
    const toggleFullscreen = () => {
        if (!playerContainerRef.current) return;

        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Reset controls timeout on user activity
    const handleUserInteraction = () => {
        setShowControls(true);
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
        }
        hideControlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    return (
        <div
            id="tutorial-player"
            data-testid="tutorial-media-player"
            className={cn("w-full max-w-4xl mx-auto flex flex-col gap-2.5 sm:gap-4", className)}
        >
            {/* Modern Segmented Chapter Selector (Clean native pill design, responsive horizontal scroll) */}
            <div className="w-full overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-gray-100/90 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/5 min-w-full sm:min-w-0">
                    {chapters.map((chapter, idx) => {
                        const isCurrent = idx === activeChapterIndex;
                        return (
                            <button
                                key={chapter.id}
                                type="button"
                                data-testid={`chapter-tab-${idx}`}
                                onClick={() => jumpToChapter(idx)}
                                className={cn(
                                    "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 select-none",
                                    isCurrent
                                        ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs font-semibold ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                <span className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono",
                                    isCurrent ? "bg-orange-500 text-white font-bold" : "bg-gray-300/70 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                                )}>
                                    {idx + 1}
                                </span>
                                <span>{chapter.shortTitle}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Video Player Display Container */}
            <div
                ref={playerContainerRef}
                onMouseMove={handleUserInteraction}
                onTouchStart={handleUserInteraction}
                onClick={togglePlay}
                className={cn(
                    "relative w-full aspect-[16/10] sm:aspect-[16/9] bg-neutral-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-neutral-800 select-none cursor-pointer group",
                    isFullscreen && "rounded-none aspect-auto h-screen max-w-none border-none"
                )}
            >
                {/* 1. Unobstructed Screenshot/Media Canvas */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`stage-canvas-${activeChapterIndex}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={activeChapter.image}
                                alt={activeChapter.title}
                                fill
                                className="object-contain object-center"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* 2. Top Title Bar Overlay (Fades out when playing) */}
                <div
                    className={cn(
                        "absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none",
                        showControls || !isPlaying ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-white drop-shadow truncate">
                            {activeChapter.title}
                        </span>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-mono text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm shrink-0">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </span>
                </div>

                {/* 3. Center Minimal Glass Play/Pause Indicator */}
                <AnimatePresence>
                    {(!isPlaying || showControls) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay();
                                }}
                                aria-label={isPlaying ? "Pause video" : "Play video"}
                                className={cn(
                                    "pointer-events-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-xl backdrop-blur-md cursor-pointer",
                                    isPlaying
                                        ? "bg-black/40 hover:bg-black/60 border border-white/20 opacity-0 group-hover:opacity-100 group-active:opacity-100"
                                        : "bg-black/70 hover:bg-black/85 border border-white/30 scale-100 hover:scale-105 active:scale-95"
                                )}
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 sm:w-7 sm:h-7" />
                                ) : (
                                    <Play className="w-5 h-5 sm:w-7 sm:h-7 ml-0.5" />
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Bottom Controls Dock (Clean, mobile-optimized, no clutter) */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "absolute bottom-0 inset-x-0 z-20 pt-6 pb-2 sm:pb-3 px-3 sm:px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300",
                        showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    {/* Scrub line with generous touch hit area */}
                    <div
                        data-testid="timeline-scrubber"
                        onClick={handleSeek}
                        className="relative w-full py-2 -my-1 cursor-pointer group/scrub"
                    >
                        <div className="w-full h-1.5 sm:h-2 bg-white/25 hover:bg-white/40 rounded-full overflow-hidden transition-all duration-150">
                            <div
                                data-testid="timeline-progress-fill"
                                className="h-full bg-orange-500 rounded-full"
                                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between gap-1 text-white">
                        {/* Left: Play/Pause, Chapter Navigation, Replay, Time */}
                        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                            <button
                                type="button"
                                data-testid="player-play-pause-btn"
                                onClick={togglePlay}
                                aria-label={isPlaying ? "Pause" : "Play"}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />}
                            </button>

                            <button
                                type="button"
                                data-testid="player-prev-chapter-btn"
                                onClick={handlePrevChapter}
                                aria-label="Previous Chapter"
                                title="Previous Chapter"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>

                            <button
                                type="button"
                                data-testid="player-next-chapter-btn"
                                onClick={handleNextChapter}
                                aria-label="Next Chapter"
                                title="Next Chapter"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>

                            <button
                                type="button"
                                data-testid="player-replay-btn"
                                onClick={handleReset}
                                aria-label="Restart from beginning"
                                title="Restart"
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>

                            <span className="text-[10px] sm:text-[11px] font-mono text-white/80 ml-1 hidden xs:inline">
                                {formatTime(currentTime)}
                            </span>
                        </div>

                        {/* Right: Speed, Mute, Fullscreen */}
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* Speed selector */}
                            <div className="flex items-center bg-white/10 hover:bg-white/20 rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-mono transition-colors">
                                <select
                                    data-testid="playback-speed-select"
                                    value={playbackSpeed}
                                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                    className="bg-transparent border-none text-white text-[10px] sm:text-[11px] focus:outline-none cursor-pointer"
                                >
                                    <option value="0.5" className="bg-neutral-900 text-white">0.5×</option>
                                    <option value="1" className="bg-neutral-900 text-white">1.0×</option>
                                    <option value="1.25" className="bg-neutral-900 text-white">1.25×</option>
                                    <option value="1.5" className="bg-neutral-900 text-white">1.5×</option>
                                    <option value="2" className="bg-neutral-900 text-white">2.0×</option>
                                </select>
                            </div>

                            {/* Mute button */}
                            <button
                                type="button"
                                data-testid="player-mute-btn"
                                onClick={() => setIsMuted(!isMuted)}
                                aria-label={isMuted ? "Unmute narration" : "Mute narration"}
                                title={isMuted ? "Unmute" : "Mute"}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                            </button>

                            {/* Fullscreen button */}
                            <button
                                type="button"
                                data-testid="player-fullscreen-btn"
                                onClick={toggleFullscreen}
                                aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-white/15 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clean Context Bar Below Player */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pt-0.5">
                <div className="min-w-0">
                    <div className="text-[11px] font-mono font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                        Step 0{activeChapterIndex + 1} · {activeChapter.shortTitle}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                        {activeChapter.description}
                    </p>
                </div>

                <Link
                    href="/shop-registration"
                    className="inline-flex items-center gap-1.5 self-start sm:self-center text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 shrink-0 group transition-colors py-1"
                >
                    <span>Start shop onboarding</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            </div>
        </div>
    );
}
