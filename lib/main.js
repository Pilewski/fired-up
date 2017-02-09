const electron = require('electron')
const realSessions = require('./real-session-data')
const sessionsArray = realSessions.realSessions

const menubar = require('menubar')
const monitor = require('active-window')
const storage = require('electron-json-storage')

const mb = menubar({
  width: 800,
  height: 500,
  // icon: './images/fire.svg'
})

let activeSession = false
let applicationList
// user should be able to set this via input field
let interval = 2000

mb.on('ready', () => {
  console.log('App is ready')
})

mb.on('after-create-window', () => {
  mb.window.loadURL(`file://${__dirname}/index.html`)
})

const startSession = () => {
  activeSession = true
  pushSessionIntoArray()
}

const pushSessionIntoArray = () => {
  sessionsArray.push({
    key: Date.now(),
    // name will be set by the user via input

    name: 'My Real Session',
    interval,
    applications: {},
  })
}

const terminateSession = () => {
  activeSession = false
  sendAllSessionsToRender()
  sendAllSessionsToStorage()
}

const sendAllSessionsToRender = () => {
  mb.window.webContents.send('update-on-session-stop', {
    data: sessionsArray,
  })
}

const sendAllSessionsToStorage = () => {
  storage.set('allSessions', {
    sessions: sessionsArray,
  })
}

const toggleActiveSession = () => {
  activeSession = !activeSession
}

callback = function (window) {
  const app = window.app

  try {
    const targetSession = sessionsArray[sessionsArray.length - 1]
    applicationList = targetSession.applications
    if (applicationList.hasOwnProperty(app)) {
      augmentAppHitCount(app)
      // Object.assign(applicationList[app], {
      //   howManyTimesHit: applicationList[app].howManyTimesHit + 1,
      // })
    } else {
      applicationList[app] = {
        name: app,
        timeCount: interval,
        // rating will be set by user
        rating: 'green',
        howManyTimesHit: 1,
      }
    }
    sendMostRecentSessionToRender()
  } catch (err) {
    console.log(err)
  }
}

const augmentAppHitCount = (app) => {
  Object.assign(applicationList[app], {
    howManyTimesHit: applicationList[app].howManyTimesHit + 1,
  })
}

const sendMostRecentSessionToRender = () => {
  mb.window.webContents.send('update-session-real-time', {
    data: sessionsArray[sessionsArray.length - 1],
  })
}

setInterval(function () {
  if (activeSession) {
    monitor.getActiveWindow(callback, 2, -2)
  }
}, interval)

Object.assign(exports, {
  startSession,
  terminateSession,
  toggleActiveSession,
  applicationList,
})
