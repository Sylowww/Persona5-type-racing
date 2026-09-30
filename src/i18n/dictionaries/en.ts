const en = {
  title: "Typing race",
  metadata: {
    title: "TYPE//STRIKE - Competitive typing syndicate",
    description: "Real-time typing races against friends, rivals and bots.",
  },
  header: {
    tagline: "Metaverse drift system",
    navLabel: "Main navigation",
    nav: {
      home: "Home // Radar",
      quickRace: "Quick race",
      lobby: "Heist lobby",
      training: "Training dojo",
      leaderboards: "Leaderboards",
    },
    server: "{server} // {count} online",
    sound: "Toggle sound",
    level: "LVL {level}",
    wpm: "{wpm} WPM",
  },
  home: {
    callingCard: {
      take: "Take their",
      words: "Words!",
      tag: "P5-key//overdrive",
    },
    startRace: {
      queue: "Active queue",
      mode: "Ranked syndicate",
      title: "Start a race",
      keys: "[Enter]",
      altKeys: "[Space]",
      or: "or",
      hint: "To auto-matchmake",
    },
    modes: {
      blitz: {
        badge: "30-sec blitz",
        title: "Quick play // 1v1",
        description: "Instantly drop into Shibuya crossroads with a random phantom rival. Pure raw WPM showdown.",
        meta: "Bet: {coins} coins",
        action: "Fight",
      },
      lobby: {
        badge: "Custom rules",
        title: "Create heist lobby",
        description: "Draft toxic poison-words, inverted key modifiers, and invite up to 8 party phantoms.",
        meta: "Slots: {min} - {max}",
        action: "Host",
      },
      training: {
        badge: "Solo drills",
        title: "Training dojo",
        description: "Palace quote transcripts, code syntax sprints, blind keystrokes, and finger speed calibration.",
        meta: "0 committed errors",
        action: "Enter",
      },
    },
    joinCode: {
      eyebrow: "Secret frequency",
      title: "Join with code",
      label: "Lobby code",
      placeholder: "P5-XXXX",
      submit: "Punch in",
    },
    typingPreview: {
      title: "Palace quote drill preview",
      subtitle: "Target keystroke stream",
      typed: "The mask",
      current: "reveals",
      upcoming: "your rebellion when words fail to ignite the palace",
    },
    dossier: {
      tape: "Confidential // Dossier #{id}",
      avatarAlt: "Player avatar",
      level: "LV.{level}",
      codename: "Codename",
      rank: "Rank: {rank}",
      syndicate: "Syndicate: {name}",
      stats: {
        record: "Record WPM",
        recordNote: "Top {percent}%",
        accuracy: "Accuracy",
        accuracyNote: "Razor sharp",
        streak: "Win streak",
        streakValue: "{count}X",
        streakNote: "Shibuya run",
      },
      radar: {
        title: "Metric radar // Keyboard proficiency",
        sync: "Sync {percent}%",
        axes: {
          burst: "Burst speed",
          accuracy: "Accuracy",
          stamina: "Stamina",
          streak: "Streak",
          rhythm: "Rhythm",
          recovery: "Recovery",
        },
      },
      leaderboard: {
        title: "Metropolitan rival leaderboard",
        live: "● Live updates",
        you: "You // {name}",
        target: "Target",
        wpm: "{wpm} WPM",
      },
      keyAudio: {
        label: "Key audio:",
        clicky: "Clicky blue",
        linear: "Linear red",
      },
    },
  },
  footer: {
    rights: "All phantom rights reserved © {year}",
    status: "Status // Online",
    encryption: "Encryption // 512-bit acid",
    version: "Version // {version}",
  },
};

export type Dictionary = typeof en;

export default en;
