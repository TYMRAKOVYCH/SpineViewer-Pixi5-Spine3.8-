import Vue from 'vue';
import * as PIXI from 'pixi.js-legacy';
import App from './App.vue';
import store from './store';
import './registerServiceWorker';
import './plugins/element';
import 'vue-resize/dist/vue-resize.css';

PIXI.utils.skipHello();

Vue.config.productionTip = false;

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');

// eslint-disable-next-line no-underscore-dangle,no-unused-expressions
window.__PIXI_INSPECTOR_GLOBAL_HOOK__ && window.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI });
