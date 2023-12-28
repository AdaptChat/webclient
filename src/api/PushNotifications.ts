import {initializeApp, FirebaseApp} from "firebase/app";
import {getMessaging, getToken, onMessage} from "firebase/messaging";
import Api from "./Api";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAUwv7mr1FK5BEpzJzqH1Bkb9tSj3e0KXY",
  authDomain: "adapt-chat.firebaseapp.com",
  projectId: "adapt-chat",
  storageBucket: "adapt-chat.appspot.com",
  messagingSenderId: "464541692865",
  appId: "1:464541692865:web:651cc571d8c787c0823540",
  measurementId: "G-W32V7KR3TQ"
} as const

const VAPID = 'BJ4XIJ_C9AHBXox8b5Ivm7F37ynaKEz0EAui1U9TwUWTs_qgnpz6PD3bVOaFNo9lToqe5dmhLZKT5SYyahpKRow'

/**
 * Handles and subscribes to push notifications via Firebase
 */
export default class PushNotifications {
  app: FirebaseApp

  constructor(public api: Api) {
    this.app = initializeApp(FIREBASE_CONFIG)
  }

  subscribe() {
    const messaging = getMessaging(this.app)
    getToken(messaging, { vapidKey: VAPID }).then((currentToken) => {
      return this.api.request('POST', '/users/me/notifications', {
        json: { key: currentToken }
      })
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err)
    })

    onMessage(messaging, (payload) => {
      console.log('[FIREBASE] Message received. ', payload)
    })
  }
}
