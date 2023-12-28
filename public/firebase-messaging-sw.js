importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAUwv7mr1FK5BEpzJzqH1Bkb9tSj3e0KXY",
  authDomain: "adapt-chat.firebaseapp.com",
  projectId: "adapt-chat",
  storageBucket: "adapt-chat.appspot.com",
  messagingSenderId: "464541692865",
  appId: "1:464541692865:web:651cc571d8c787c0823540",
  measurementId: "G-W32V7KR3TQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Received background message ', payload);

    self.registration.showNotification("test message", { body: "test body" });  
});