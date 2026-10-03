"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { defaultHomeTheme, homeThemes, isHomeTheme, musicSourceFor, type HomeTheme } from "@/lib/music";

const mutedKey = "music:muted";
const themeKey = "music:home-theme";
const volume = 0.35;

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode); the choice then lasts for this page only.
  }
}

/** Background music for the whole site: race theme on the race page, the chosen home theme elsewhere. */
export function MusicPlayer({ dictionary }: { dictionary: Dictionary["header"]["music"] }) {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [theme, setTheme] = useState<HomeTheme>(defaultHomeTheme);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Saved preferences are read after mount so the server and client render the same markup.
  useEffect(() => {
    const savedTheme = readStorage(themeKey);
    /* eslint-disable react-hooks/set-state-in-effect */
    setMuted(readStorage(mutedKey) === "true");
    if (isHomeTheme(savedTheme)) setTheme(savedTheme);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const source = musicSourceFor(pathname, theme);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !loaded) return;

    if (!audio.src.endsWith(source)) {
      audio.src = source;
      audio.volume = volume;
    }
    if (muted) {
      audio.pause();
      return;
    }

    // Browsers block autoplay until the visitor interacts with the page; retry on the first interaction.
    const play = () => {
      audio.play().catch(() => undefined);
    };
    audio.play().catch(() => {
      window.addEventListener("pointerdown", play, { once: true });
      window.addEventListener("keydown", play, { once: true });
    });
    return () => {
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("keydown", play);
    };
  }, [source, muted, loaded]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [menuOpen]);

  function toggleMuted() {
    setMuted((current) => {
      writeStorage(mutedKey, String(!current));
      return !current;
    });
  }

  function chooseTheme(next: HomeTheme) {
    setTheme(next);
    writeStorage(themeKey, next);
    setMenuOpen(false);
  }

  const buttonClass =
    "flex size-9 items-center justify-center bg-surface-container text-on-surface-variant transition-colors hover:text-on-surface";

  return (
    <div ref={menuRef} className="relative flex items-center gap-1">
      <audio ref={audioRef} loop preload="none" />

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={dictionary.theme}
        title={dictionary.theme}
        onClick={() => setMenuOpen((open) => !open)}
        className={buttonClass}
      >
        <Icon name="music_note" size={20} />
      </button>

      <button
        type="button"
        aria-pressed={muted}
        aria-label={muted ? dictionary.unmute : dictionary.mute}
        title={muted ? dictionary.unmute : dictionary.mute}
        onClick={toggleMuted}
        className={buttonClass}
      >
        <Icon name={muted ? "volume_off" : "volume_up"} size={20} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label={dictionary.theme}
          className="absolute right-0 top-full mt-2 flex w-48 flex-col bg-surface-container-high p-1 shadow-hard-sm shadow-secondary"
        >
          <span className="px-2 py-1 font-hud text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            {dictionary.theme}
          </span>
          {homeThemes.map((option) => {
            const isSelected = option === theme;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => chooseTheme(option)}
                className={`flex items-center justify-between px-2 py-1.5 text-left font-hud text-label-hud font-black uppercase transition-colors ${
                  isSelected
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:text-secondary"
                }`}
              >
                {dictionary.themes[option]}
                {isSelected && <Icon name="check" size={16} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
