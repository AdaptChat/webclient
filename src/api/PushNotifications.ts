import {getAnalytics, type Analytics} from "firebase/analytics";
import {FirebaseApp, initializeApp} from "firebase/app";
import {getMessaging, getToken, Messaging, onMessage} from "firebase/messaging";
import Api from "./Api";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCLxCU60cABrOneUgs2rQXIzNWl9MehBlQ",
  authDomain: "adapt-chat-2.firebaseapp.com",
  projectId: "adapt-chat-2",
  storageBucket: "adapt-chat-2.firebasestorage.app",
  messagingSenderId: "516583022231",
  appId: "1:516583022231:web:84baa083f9e35b5b4ad3d2",
  measurementId: "G-PRVX9CFT8Q"
} as const

const VAPID = 'BAsaxzVjW2JLuRBkJpAByKG994vxkMrYBX8DLyTYqXT3beoPx2tY9hgEYWME_SsVQweXyAi1nYTUj81CMK0f6dQ'

/**
 * Handles and subscribes to push notifications via Firebase
 */
export default class PushNotifications {
  app: FirebaseApp
  messaging: Messaging
  analytics: Analytics

  constructor(public api: Api) {
    this.app = initializeApp(FIREBASE_CONFIG)
    this.messaging = getMessaging(this.app)
    this.analytics = getAnalytics(this.app)

    onMessage(this.messaging, (payload) => {
      console.log('[FIREBASE] Message received. ', payload)
    })
  }

  subscribe() {
    getToken(this.messaging, { vapidKey: VAPID }).then((currentToken) => {
      return this.api.request('POST', '/users/me/notifications', {
        json: { key: currentToken }
      })
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err)
    })
  }
}
