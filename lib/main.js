const electron = require('electron')
const { dialog } = electron
const realSessions = require('./real-session-data')
let sessionsArray = realSessions.realSessions

const menubar = require('menubar')
const monitor = require('active-window')

const mb = menubar({
  width: 500,
  height: 500,
  icon: './images/fire.png',
})

let activeSession = false
let currentSessionName
const interval = 1000
let applicationList

mb.on('ready', () => {
  console.log('App is ready')
  if ([[[NSUserDefaults standardUserDefaults] stringForKey:@"AppleInterfaceStyle"]  isEqual: @"Dark"])
  {
    mb.tray.setImage('./images/icon.png')
  }
})

mb.on('after-create-window', () => {
  mb.window.loadURL(`file://${__dirname}/index.html`)
})

const setSessionNameByUser = (name) => {
  currentSessionName = name
}

const startSession = () => {
  activeSession = true
  pushSessionIntoArray()
  mb.tray.setImage('./images/icon.png')
  setSessionNameByUser()
  hideSessionNameInput()
}

const clearSessionsArray = () => {
  sessionsArray = []
}

const hideSessionNameInput = () => {
  mb.window.webContents.send('hide-session-name-input', {
    order: 'Hide Session Name',
  })
}

const pushSessionIntoArray = () => {
  sessionsArray.push({
    key: Date.now(),
    name: currentSessionName || 'New Session',
    interval,
    applications: {},
  })
}

const terminateSession = () => {
  activeSession = false
  mb.tray.setImage('./images/fire.png')
  currentSessionName = ''
  showSessionNameInput()
}

const showSessionNameInput = () => {
  mb.window.webContents.send('show-session-name-input', {
    order: 'Show Session Name',
  })
}

const toggleActiveSession = () => {
  activeSession = !activeSession
}

const callback = function (window) {
  const app = window.app

  try {
    const targetSession = sessionsArray[sessionsArray.length - 1]
    applicationList = targetSession.applications
    if (applicationList.hasOwnProperty(app)) {
      augmentAppHitCount(app)
    } else {
      instantiateNewApp(app)
    }
    sendMostRecentSessionToRender()
  } catch (err) {
    console.error(err)
  }
}

const augmentAppHitCount = (app) => {
  Object.assign(applicationList[app], {
    howManyTimesHit: applicationList[app].howManyTimesHit + 1,
  })
}

const instantiateNewApp = (app) => {
  applicationList[app] = {
    name: app,
    timeCount: interval,
    rating: 'green',
    howManyTimesHit: 1,
  }
}

const sendMostRecentSessionToRender = () => {
  mb.window.webContents.send('update-session-real-time', {
    data: sessionsArray[sessionsArray.length - 1],
  })
}

setInterval(() => {
  if (activeSession) {
    monitor.getActiveWindow(callback, -1, 1000)
  }
}, interval)

Object.assign(exports, {
  startSession,
  terminateSession,
  toggleActiveSession,
  applicationList,
  setSessionNameByUser,
  dialog,
  clearSessionsArray,
})
