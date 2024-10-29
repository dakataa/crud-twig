import {precacheAndRoute} from 'workbox-precaching';
// Your other import statements go here.

precacheAndRoute(self.__WB_MANIFEST);
// Your other SW code goes here.

self.addEventListener('message', function (e) {
    let message = e.data;

}, false);

self.addEventListener('fetch', function (event) {
});
