'use strict';

// Apply the same browser protections to local responses and CDN assets.
const securityHeaders={
 'X-Content-Type-Options':'nosniff',
 'X-Frame-Options':'DENY',
 'Referrer-Policy':'strict-origin-when-cross-origin',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Content-Security-Policy':"default-src 'self'; img-src 'self' https: data:; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};

// Internal manifests, source maps, dotfiles and backups are never public assets.
function isPublicAsset(relative){
 return relative==='favicon.svg'||(
  /^assets\/[a-zA-Z0-9_./-]+$/.test(relative)&&
  relative.split('/').every(segment=>segment&&!segment.startsWith('.'))&&
  /\.(?:css|js|svg|jpg|jpeg|png|webp|avif|ico|woff2?|ttf|otf|txt|mp4)$/i.test(relative)
 );
}

module.exports={securityHeaders,isPublicAsset};
