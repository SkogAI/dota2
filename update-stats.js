#!/usr/bin/env node
// Fetches fresh stats from OpenDota API and updates squad-stats.html
const https = require('https');
const fs = require('fs');

const PLAYERS = [
  { name: 'Skogix', pid: '116550742' },
  { name: 'ZCOPE', pid: '37551669' },
  { name: '"Nagasaki" Brave Boy', pid: '1191295354' },
];

const RANK_NAMES = {
  0: 'Uncalibrated', 10: 'Herald 0', 11: 'Herald 1', 12: 'Herald 2', 13: 'Herald 3', 14: 'Herald 4', 15: 'Herald 5',
  20: 'Guardian 0', 21: 'Guardian 1', 22: 'Guardian 2', 23: 'Guardian 3', 24: 'Guardian 4', 25: 'Guardian 5',
  30: 'Crusader 0', 31: 'Crusader 1', 32: 'Crusader 2', 33: 'Crusader 3', 34: 'Crusader 4', 35: 'Crusader 5',
  40: 'Archon 0', 41: 'Archon 1', 42: 'Archon 2', 43: 'Archon 3', 44: 'Archon 4', 45: 'Archon 5',
  50: 'Legend 0', 51: 'Legend 1', 52: 'Legend 2', 53: 'Legend 3', 54: 'Legend 4', 55: 'Legend 5',
  60: 'Ancient 0', 61: 'Ancient 1', 62: 'Ancient 2', 63: 'Ancient 3', 64: 'Ancient 4', 65: 'Ancient 5',
  70: 'Divine 0', 71: 'Divine 1', 72: 'Divine 2', 73: 'Divine 3', 74: 'Divine 4', 75: 'Divine 5',
  80: 'Immortal',
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Dota2Hub/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Failed to parse ${url}: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHeroList() {
  console.log('  Fetching hero list...');
  const heroes = await fetch('https://api.opendota.com/api/heroes');
  const map = {};
  heroes.forEach(h => {
    map[h.id] = {
      name: h.localized_name,
      img: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${h.name.replace('npc_dota_hero_', '')}.png?`,
      attr: h.primary_attr === 'str' ? 'str' : h.primary_attr === 'agi' ? 'agi' : h.primary_attr === 'int' ? 'int' : 'all',
      roles: h.roles || [],
    };
  });
  return map;
}

async function fetchPlayerData(pid, name, heroMap) {
  const base = `https://api.opendota.com/api/players/${pid}`;

  console.log(`  Fetching ${name}...`);

  // Profile
  const profile = await fetch(base);
  await delay(250);

  // Win/Loss
  const wl = await fetch(`${base}/wl`);
  await delay(250);

  // Totals
  const totalsRaw = await fetch(`${base}/totals`);
  await delay(250);

  // Heroes
  const heroesRaw = await fetch(`${base}/heroes`);
  await delay(250);

  // Recent matches
  const recentRaw = await fetch(`${base}/recentMatches`);
  await delay(250);

  // Parse totals into object
  const totals = {};
  const totalFields = [
    'kills', 'deaths', 'assists', 'kda', 'gold_per_min', 'xp_per_min',
    'last_hits', 'denies', 'lane_efficiency_pct', 'duration', 'level',
    'hero_damage', 'tower_damage', 'hero_healing', 'stuns', 'tower_kills',
    'neutral_kills', 'courier_kills', 'purchase_tpscroll', 'purchase_ward_observer',
    'purchase_ward_sentry', 'purchase_gem', 'purchase_rapier', 'pings',
    'throw', 'comeback', 'stomp', 'loss', 'actions_per_min',
  ];
  totalsRaw.forEach(t => {
    if (totalFields.includes(t.field)) {
      totals[t.field] = Math.round(t.sum / Math.max(t.n, 1) * 10) / 10;
    }
  });

  // Parse heroes - top 30 by games
  const heroStats = heroesRaw
    .filter(h => h.games > 0 && heroMap[h.hero_id])
    .sort((a, b) => b.games - a.games)
    .slice(0, 30)
    .map(h => {
      const info = heroMap[h.hero_id];
      return {
        name: info.name,
        img: info.img,
        attr: info.attr,
        roles: info.roles,
        g: h.games,
        w: h.win,
        wr: Math.round(h.win / h.games * 1000) / 10,
      };
    });

  // Parse recent matches - take 20
  const recent = recentRaw.slice(0, 20).map(m => {
    const hero = heroMap[m.hero_id] || { name: 'Unknown', img: '' };
    const win = (m.player_slot < 128) === m.radiant_win;
    const d = new Date(m.start_time * 1000);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const durMin = Math.floor(m.duration / 60);
    const durSec = String(m.duration % 60).padStart(2, '0');
    return {
      hero: hero.name,
      img: hero.img,
      result: win ? 'Win' : 'Loss',
      k: m.kills,
      d: m.deaths,
      a: m.assists,
      gpm: m.gold_per_min,
      xpm: m.xp_per_min,
      dur: `${durMin}:${durSec}`,
      date: `${mm}/${dd}`,
    };
  });

  // Form: 1 for win, 0 for loss (last 20)
  const form = recent.map(m => m.result === 'Win' ? 1 : 0);

  // Role aggregation from hero stats
  const roles = {};
  heroesRaw.filter(h => h.games > 0 && heroMap[h.hero_id]).forEach(h => {
    const info = heroMap[h.hero_id];
    (info.roles || []).forEach(role => {
      if (!roles[role]) roles[role] = { g: 0, w: 0, wr: 0 };
      roles[role].g += h.games;
      roles[role].w += h.win;
    });
  });
  Object.keys(roles).forEach(r => {
    roles[r].wr = Math.round(roles[r].w / Math.max(roles[r].g, 1) * 1000) / 10;
  });

  const rankTier = profile.rank_tier || 0;
  const rankName = RANK_NAMES[rankTier] || RANK_NAMES[Math.floor(rankTier / 10) * 10] || 'Uncalibrated';

  return {
    name,
    avatar: profile.profile?.avatarfull || '',
    pid,
    rank: rankName,
    rankTier,
    wl: { win: wl.win || 0, lose: wl.lose || 0 },
    totals,
    heroStats,
    recent,
    form,
    roles,
  };
}

async function main() {
  const heroMap = await fetchHeroList();
  await delay(300);

  const players = [];
  for (const p of PLAYERS) {
    players.push(await fetchPlayerData(p.pid, p.name, heroMap));
  }

  // Read the HTML file
  const html = fs.readFileSync('squad-stats.html', 'utf8');

  // Replace the P data
  const dataLine = `var P = ${JSON.stringify(players)};`;
  const updated = html.replace(/var P = \[.*?\];/s, dataLine);

  if (updated === html) {
    console.error('ERROR: Could not find var P = [...] in squad-stats.html');
    process.exit(1);
  }

  fs.writeFileSync('squad-stats.html', updated);
  console.log('  squad-stats.html updated!');
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
