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
    `)
  }
};
