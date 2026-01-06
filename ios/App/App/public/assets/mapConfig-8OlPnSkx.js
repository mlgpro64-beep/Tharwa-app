const s={dark:{name:"Dark",url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',maxZoom:20,subdomains:"abcd"},light:{name:"Light",url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19,subdomains:"abc"},colorful:{name:"Colorful",url:"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',maxZoom:20,subdomains:"abcd"},satellite:{name:"Satellite",url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",attribution:'&copy; <a href="https://www.esri.com/">Esri</a>',maxZoom:19}},c={size:32,iconSize:[32,32],iconAnchor:[16,16],className:"task-location-marker"};function m(r,t){return"light"}function l(r="colorful"){return s[r]||s.colorful}function u(r="colorful"){const t=l(r),o={minZoom:1,maxZoom:t.maxZoom||20,attribution:t.attribution||""};return t.subdomains&&(o.subdomains=t.subdomains),{url:t.url,options:o}}function p(r=32,t=!0,o="primary"){const i=t?"animate-ping":"",e=r/2,a=r,n=o==="primary"?"marker-primary":"marker-accent";return`
    <div class="relative marker-container" style="width: ${a}px; height: ${a}px;">
      ${t?`<div class="absolute inset-0 rounded-full ${i} marker-pulse ${n}"></div>`:""}
      <div class="relative rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 marker-circle ${n}" 
           style="width: ${a}px; height: ${a}px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `}function h(r,t={},o=!0,i="primary"){const e={...c,...t},a=p(e.size,o,i);return r.divIcon({className:e.className,html:a,iconSize:e.iconSize,iconAnchor:e.iconAnchor})}export{h as a,u as c,m as g};
