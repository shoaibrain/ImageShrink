const path = require('path')
const os = require('os')
const imagemin = require('imagemin')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log')
const {app, BrowserWindow, Menu, ipcMain, shell} = require ('electron')

// Which environemnt we're in
// Set Environment
process.env.NODE_ENV = 'production'  //development

const isDev = process.env.NODE_ENV !== 'production'? true: false
const isMac = process.platform == 'darwin' ? true:false

let mainWindow
let aboutWindow

function CreateMainWindow () {
        mainWindow = new BrowserWindow ({
        title: "CompressImage",
        width: isDev ? 700: 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        webPreferences: {
            nodeIntegration: true,
        },

        resizable: isDev,
        backgroundColor: 'white'
    })

    if (isDev) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.loadURL(`file://${__dirname}/app/home.html`)
    // mainWindow.loadFile('./app/home.html')
}
function CreateaboutWindow () {
    aboutWindow = new BrowserWindow ({
    title: "About CompressImage",
    width: 300,
    height: 300,
    // icon: `${__dirname}/assets/icons/Icon_256x256.png`,

    resizable: false,
    backgroundColor: 'white'
})

aboutWindow.loadURL(`file://${__dirname}/app/about.html`)
}


app.on('ready', () => {
    CreateMainWindow()

    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)
    mainWindow.on('ready', () => (mainWindow = null))
})

const menu = [
    ...(isMac ? [{ 
        label: app.name, 
        submenu: [
            {
                label:'About',
                click: CreateaboutWindow
    
            }
        ]
    }] : []),

    {
        role: 'fileMenu'
    },
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label:'About',
                    click: CreateaboutWindow
                },
            ]
        }
    ]:[]),

    ...(isDev ? [
        {
            label: 'Developer',
            submenu: [
                {role: 'reload' },
                {role: 'forcereload' },
                {type: 'separator' },
                {role: 'toggledevtools' },
                
            ]
        }
    ]:[])

   
]



app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })


  ipcMain.on('image:minimize', (e,options) => {
      options.dest = path.join(os.homedir(),'imagecompress')
      compressImage(options)
  })


  async function compressImage({imgPath, quality,dest }) {

    try{
        const pngQuality = quality/100

        const files = await imagemin([slash(imgPath)],{
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality}),
                imageminPngquant({
                    quality:[pngQuality, pngQuality]
                })
            ]
        })
        
        log.info(files)
        shell.openPath(dest)

        mainWindow.webContents.send('image:done')

    }
    catch (err){
        
        log.error(err)
    }

  }


app.allowRendererProcessReuse = true