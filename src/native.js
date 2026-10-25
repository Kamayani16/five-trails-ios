// Native features for the iPhone app, bundled into www/native.js by scripts/build.mjs.
// The game (app.js) only looks for these globals, so the same game runs on the web without them.

// App Store purchases: defines window.CdvPurchase (free, MIT: github.com/j3k0/cordova-plugin-purchase).
import 'capacitor-plugin-cdv-purchase';
// Local reminders ("your free chest is ready"), which app.js finds at Capacitor.Plugins.LocalNotifications.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const cap = (window.Capacitor = window.Capacitor || Capacitor);
cap.Plugins = cap.Plugins || {};
if (!cap.Plugins.LocalNotifications) cap.Plugins.LocalNotifications = LocalNotifications;
document.documentElement.classList.add('native-ios');
