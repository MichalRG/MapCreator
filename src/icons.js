function svgToDataUrl(svg) {
  const compact = svg.replace(/\s+/g, " ").trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(compact)}`;
}

export const BUILTIN_ICON_URLS = {
  terrain: {
    plains: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke="#866237" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">
          <path d="M8 18V8" />
          <path d="M8 10c-2.2 0-3.2-1.2-3.8-2.9" />
          <path d="M8 13c-2 0-2.9-1.1-3.5-2.5" />
          <path d="M16 18V7" />
          <path d="M16 9c2.2 0 3.2-1.2 3.8-2.9" />
          <path d="M16 12c2 0 2.9-1.1 3.5-2.5" />
          <path d="M5 18h14" />
        </g>
      </svg>
    `),
    forest: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#446341" stroke="#2d4930" stroke-linejoin="round" stroke-width="1.2">
          <path d="M7 18V15H4.5L7 11l2.5 4H7v3Z" />
          <path d="M13 18V13H9l4-6 4 6h-4v5Z" />
          <path d="M18 18v-2.6h-2.2L18 12l2.2 3.4H18V18Z" />
        </g>
      </svg>
    `),
    mountains: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#7d8189" stroke="#555963" stroke-linejoin="round" stroke-width="1.2">
          <path d="M3 18 9 8l6 10Z" />
          <path d="M9 18 15 10l6 8Z" />
          <path d="M9 8l1.6 2.4L9.8 11.8 8.3 10Z" fill="#edf0f4" stroke="none" />
          <path d="M15 10l1.2 1.7-1.1 1.1-1.2-1.5Z" fill="#edf0f4" stroke="none" />
        </g>
      </svg>
    `),
    swamp: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 16c2.2-2 3.8 2 6 0s3.8-2 6 0 3.8 2 4 0" stroke="#536846" stroke-width="1.6" />
          <path d="M6 18c1.6-1.4 2.8 1.4 4.5 0S13.5 16.6 16 18s3.2 1.4 4 0" stroke="#70845b" stroke-width="1.6" />
          <path d="M8 6v8M12 5v9M16 7v7" stroke="#4f5a30" stroke-width="1.5" />
          <path d="m7 8-1.5 2M9 9l-1.8 1.8M13 7l-1.7 2M17 9l1.5 1.8" stroke="#7f9a56" stroke-width="1.2" />
        </g>
      </svg>
    `),
    lake: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 13.5c0-3 2.6-5.5 6-5.5s6 2.5 6 5.5-2.6 5.5-6 5.5-6-2.5-6-5.5Z" fill="#74b7e4" stroke="#3f7ea8" stroke-width="1.2" />
          <path d="M8 13.5c1.2-.9 2.5-.9 3.7 0s2.5.9 3.7 0" stroke="#2f6f9e" stroke-width="1.2" />
          <path d="M8.2 15.8c1-.7 2.1-.7 3.2 0s2.2.7 3.2 0" stroke="#2f6f9e" stroke-width="1.1" />
        </g>
      </svg>
    `),
    rock: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#403832" stroke="#231d1a" stroke-linejoin="round" stroke-width="1.2">
          <path d="M6 18 4 12l4-5 6-1 5 4 1 6-5 3Z" />
          <path d="m8 10 3-2 4 2-1 4H9Z" fill="#5a4d45" />
        </g>
      </svg>
    `),
    chamber: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path d="M4 16c0-4.6 3.6-8.2 8-8.2s8 3.6 8 8.2" fill="#826f5c" stroke="#564738" stroke-width="1.4" />
          <path d="M7 16c.9-2.1 2.8-3.2 5-3.2s4.1 1.1 5 3.2" stroke="#cab49a" stroke-width="1.2" />
        </g>
      </svg>
    `),
    underground_water: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 15c2-3 4-4.5 8-4.5s6 1.5 8 4.5" fill="#355967" stroke="#223c47" stroke-width="1.4" />
          <path d="M6 16.8c1.3-.9 2.7-.9 4 0s2.7.9 4 0 2.7-.9 4 0" stroke="#84c3de" stroke-width="1.2" />
        </g>
      </svg>
    `),
    lava: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 17c0-3.8 3.6-6.5 8-6.5s8 2.7 8 6.5" fill="#be5d2f" stroke="#6d2f16" stroke-width="1.4" />
          <path d="M7 16c1.2-1.8 1.2-3.3 0-4.7M12 16c1.2-1.8 1.2-3.3 0-4.7M17 16c1.2-1.8 1.2-3.3 0-4.7" stroke="#ffd08b" stroke-width="1.1" />
        </g>
      </svg>
    `),
    mushroom_grove: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 18v-3M7 15c0-1.8 1.4-3 3-3s3 1.2 3 3" fill="#7f9072" stroke="#3f4738" stroke-width="1.2" />
          <path d="M15 18v-4M15 14c0-2 1.5-3.3 3.2-3.3 1 0 1.9.4 2.5 1.2" fill="#90a180" stroke="#4c5744" stroke-width="1.2" />
          <path d="M10 10c1 0 2 .4 2.7 1.2M17 9.5c1.2 0 2.2.5 3 1.4" stroke="#e0dac5" stroke-width="1.1" />
        </g>
      </svg>
    `),
    crystal_field: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#8aa2ca" stroke="#44546b" stroke-linejoin="round" stroke-width="1.2">
          <path d="m6 18 2-7 3 3 2-8 5 12Z" />
          <path d="m10 18 1.2-4.4L13 16l1.2-5.2L18 18Z" fill="#bed3f3" />
        </g>
      </svg>
    `)
  },
  overlay: {
    village: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#9f6d3c" stroke="#6b451f" stroke-linejoin="round" stroke-width="1.2">
          <path d="M4 18v-5.2L8 9l4 3.8V18Z" />
          <path d="M12 18v-4.5L15.5 10 20 13.5V18Z" />
          <path d="M7 18v-2.8h2V18M15 18v-2.2h1.6V18" fill="#f7edd9" />
        </g>
      </svg>
    `),
    stronghold: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#6b4a2c" stroke="#3f2815" stroke-linejoin="round" stroke-width="1.2">
          <path d="M4 18V8h3v2h2V8h6v2h2V8h3v10Z" />
          <path d="M10 18v-4h4v4" fill="#f1e4c8" />
        </g>
      </svg>
    `),
    city: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#6c5844" stroke="#463526" stroke-linejoin="round" stroke-width="1.2">
          <path d="M4 18V11l4-2v9Z" />
          <path d="M9 18V7l5-2v13Z" />
          <path d="M15 18v-9l5 2v7Z" />
          <path d="M11 10h1M11 13h1M16.5 13h1M6 13h1" stroke="#f6eddd" stroke-linecap="round" />
        </g>
      </svg>
    `),
    cave: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#5e5b58" stroke="#3f3d3b" stroke-linejoin="round" stroke-width="1.2">
          <path d="M4 18c0-6 3.5-11 8-11s8 5 8 11Z" />
          <path d="M9 18v-4.2c0-1.9 1.3-3.2 3-3.2s3 1.3 3 3.2V18Z" fill="#242424" stroke="none" />
        </g>
      </svg>
    `),
    tower: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#49657a" stroke="#2f4556" stroke-linejoin="round" stroke-width="1.2">
          <path d="M8 18V9h8v9Z" />
          <path d="M7 9h10l-1.2-3H8.2Z" />
          <path d="M10.5 18v-3.2c0-1 .7-1.8 1.5-1.8s1.5.8 1.5 1.8V18" fill="#f3ead7" />
        </g>
      </svg>
    `),
    special_place: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#a14c58" stroke="#712d37" stroke-linejoin="round" stroke-width="1.2">
          <path d="m12 4 2.2 4.5 5 .7-3.6 3.4.9 4.9L12 15.4 7.5 17.5l.9-4.9-3.6-3.4 5-.7Z" />
          <circle cx="12" cy="11" r="1.2" fill="#f8eedf" stroke="none" />
        </g>
      </svg>
    `),
    camp: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#c89a5b" stroke="#7a5124" stroke-linejoin="round" stroke-width="1.2">
          <path d="M4.5 18 8 10.5 11.5 18Z" />
          <path d="M12.5 18 16 10.5 19.5 18Z" />
          <path d="M8 10.5v-2.2M16 10.5V8.1" stroke-linecap="round" />
          <path d="M6.4 18h11.2" fill="none" stroke-linecap="round" />
        </g>
      </svg>
    `),
    entrance: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path d="M4 18c0-5.4 3.6-10 8-10s8 4.6 8 10Z" fill="#d8c389" stroke="#8e7542" stroke-width="1.3" />
          <path d="M12 18v-6.2" stroke="#4e3c1b" stroke-width="1.4" />
          <path d="m9.8 13.6 2.2-2.2 2.2 2.2" stroke="#4e3c1b" stroke-width="1.4" />
        </g>
      </svg>
    `),
    exit: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path d="M4 18c0-5.4 3.6-10 8-10s8 4.6 8 10Z" fill="#7aa3b0" stroke="#496a74" stroke-width="1.3" />
          <path d="M12 11.8V18" stroke="#eff8fa" stroke-width="1.4" />
          <path d="m9.8 15.6 2.2 2.2 2.2-2.2" stroke="#eff8fa" stroke-width="1.4" />
        </g>
      </svg>
    `),
    treasure: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#d8ad4d" stroke="#7a5820" stroke-linejoin="round" stroke-width="1.2">
          <path d="M5 11h14v7H5Z" />
          <path d="M7 11V8.8c0-1.5 1.2-2.8 2.8-2.8 1.1 0 1.8.4 2.2 1.2.4-.8 1.1-1.2 2.2-1.2C15.8 6 17 7.3 17 8.8V11" fill="#efcb70" />
          <path d="M12 11v7" stroke="#fff3cf" stroke-linecap="round" />
        </g>
      </svg>
    `),
    nest: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 16c1.2 2 3.5 3 7 3s5.8-1 7-3" stroke="#724235" stroke-width="1.5" />
          <path d="M6 15c1.8-1 3.8-1.5 6-1.5s4.2.5 6 1.5" stroke="#8e584a" stroke-width="1.4" />
          <circle cx="10" cy="13" r="1.2" fill="#d3c8ba" stroke="#8e584a" stroke-width="1" />
          <circle cx="13.8" cy="12.6" r="1.1" fill="#d3c8ba" stroke="#8e584a" stroke-width="1" />
        </g>
      </svg>
    `),
    altar: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#8679a7" stroke="#554b69" stroke-linejoin="round" stroke-width="1.2">
          <path d="M7 18h10l-1.5-5h-7Z" />
          <path d="M9 13h6l1.3-4H7.7Z" />
          <path d="M12 6.2 13.5 9h-3Z" fill="#f1e6ff" />
        </g>
      </svg>
    `),
    stalagmites: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="#8f989d" stroke="#596168" stroke-linejoin="round" stroke-width="1.1">
          <path d="M5 18 8 9l3 9Z" />
          <path d="M10 18 12.8 7 16 18Z" />
          <path d="M15 18 18.2 10 20 18Z" />
        </g>
      </svg>
    `),
    rope_bridge: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 9v7M20 9v7" stroke="#6d5338" stroke-width="1.6" />
          <path d="M4 9c4 4 12 4 16 0" stroke="#8f7354" stroke-width="1.3" />
          <path d="M5.5 10.3v3.2M9 11.4v2.8M12 11.8v2.5M15 11.4v2.8M18.5 10.3v3.2" stroke="#d4b183" stroke-width="1.1" />
        </g>
      </svg>
    `)
  },
  edge: {
    river: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M6 5c2 3 1 5 4 7s4 2 5 7" fill="none" stroke="#2f6f9e" stroke-linecap="round" stroke-width="3" />
      </svg>
    `),
    path: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M5 18c3-5 4-7 7-8s4-1 7-4" fill="none" stroke="#a17645" stroke-dasharray="3 3" stroke-linecap="round" stroke-width="2.4" />
      </svg>
    `),
    track: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke="#77563a" stroke-linecap="round" stroke-width="1.8">
          <path d="M6 18c3-5 4-7 7-8s4-1 7-4" />
          <path d="M4.5 16.5c3-5 4-7 7-8s4-1 7-4" opacity=".7" />
        </g>
      </svg>
    `),
    tunnel: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M5 17c3-4 5-6 7-6s4 2 7 6" fill="none" stroke="#b59a75" stroke-linecap="round" stroke-width="3.2" />
      </svg>
    `),
    stream: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M4 16c3-3 4-6 8-6s5 3 8 6" fill="none" stroke="#5d95b0" stroke-dasharray="3 3" stroke-linecap="round" stroke-width="2.4" />
      </svg>
    `),
    chasm: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g fill="none" stroke="#111217" stroke-linecap="round" stroke-width="2.4">
          <path d="M6 18c2-4 3-7 6-8" />
          <path d="M12 10c2 1 3 4 6 8" />
        </g>
      </svg>
    `)
  }
};
