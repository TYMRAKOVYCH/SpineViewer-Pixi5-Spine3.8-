/* eslint-disable no-console */

import { register } from 'register-service-worker';
import { Message } from 'element-ui';

if (process.env.NODE_ENV === 'production') {
  const messageOptions = {
    duration: 5e3,
    showClose: true,
  };

  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      Message(Object.assign(...messageOptions, {
        message: 'App is being served from cache.',
      }));
    },
    registered() {
      console.log('Service worker has been registered.');
    },
    cached() {
      Message(Object.assign(...messageOptions, {
        message: 'Content has been cached for offline use.',
        type: 'success',
      }));
    },
    updatefound() {
      Message(Object.assign(...messageOptions, {
        message: 'New content is downloading.',
      }));
    },
    updated() {
      Message(Object.assign(...messageOptions, {
        message: 'The app has been updated!\n'
          + 'Please close tab with app and open again to enjoy the latest changes',
        type: 'success',
      }));
    },
    offline() {
      Message(Object.assign(...messageOptions, {
        message: 'No internet connection found. App is running in offline mode.',
        type: 'warning',
      }));
    },
    error(error) {
      Message(Object.assign(...messageOptions, {
        message: `Error during service worker registration:${error}`,
        type: 'error',
      }));
    },
  });
}
