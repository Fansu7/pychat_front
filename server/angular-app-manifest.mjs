
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/pychat_front/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/pychat_front/login",
    "route": "/pychat_front"
  },
  {
    "renderMode": 2,
    "route": "/pychat_front/login"
  },
  {
    "renderMode": 2,
    "route": "/pychat_front/home"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 508, hash: 'f498cff1044cdcc1e09b0a98530b2422ef275715a9a0a808e1fdaaa339919864', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1021, hash: '5001dd22a6957d9f483a788a4e2d8f14961603dc7377f3c78a4ed20387f3a27b', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'home/index.html': {size: 3739, hash: '3e11ecf51a74534fc7f52804874c567ff19b19d903d84b35d2cf28fda623f866', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 3739, hash: '3e11ecf51a74534fc7f52804874c567ff19b19d903d84b35d2cf28fda623f866', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
