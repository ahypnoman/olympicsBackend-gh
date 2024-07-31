// if javaScratch isn't downloaded already, run this: npm install https://github.com/ahypnoman/javaScratch/
// this code is terribly written - I put it together in a few hours without caring about consistency or comments, and some of the code is reused from my javaScratch demo project

const Session = require("javascratch").Session

const sessionKey = "Scratch session ID (get from cookies in your browser - find 'scratchsessionsid'. Include the quotes)"
const projectId = "Scratch project ID (as a string)"

const session = new Session(null, null, {sessionId: sessionKey})
const project = new session.Project(projectId)
const key = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "!", "/", " "]
const updateInterval = 60000

function description() {
    return `––– Olympics medal tracker –––––––\nYou need a good internet connection to use this project\n\n––– About –––––––––––––––––––––––\nThe Olympics is the largest athletics and sports competition in the world. Using external APIs and Node + javaScratch (see: https://scratch.mit.edu/projects/900753910/ ), this project provides a live medal count for the Olympic games.\n\n––– Medal and sorting info –––––––––\nMedals labelled "G" indicate gold medals\nMedals labelled "S" indicate silver medals\nMedals labelled "B" indicate bronze medals\nMedals labelled "T" indicate the total medal count.\n\nCountries are sorted by, in order of sorting precedence:\n- Gold medals\n- Silver medals\n- Bronze medals\n- Alphabetical order\n\n––– Technical info ––––––––––––––––\nBackend and frontend are entirely by me (except javaScratch's dependencies). Data is pulled from bbc.co.uk.\n\nIf you want the source code for the backend, ask and I'll put it on github.\n\n––– Notice ––––––––––––––––––––––\n this server is not always active as it is dependent on my personal computer being on. The server last checked in at ` + new Date().toLocaleString() + `. This time should update approx every 10 minutes if the server is up. (Timestamp is in BST)`
}


const encode = (toEncode) => [...toEncode].map(x => key.indexOf(x.toLowerCase().toString()) + 10).join("")

let open = false


session.onReady = () => {
    project.setData({
        "description": description()
    })
    console.log("pinged project")
    setInterval(() => {
        project.setData({
            "description": description()
        })
        console.log("pinged project")
    }, updateInterval)
    const socket = new project.CloudSocket()

    async function update() {
        // code borrowed from Scratch to get 'days since 2000'
        const msPerDay = 24 * 60 * 60 * 1000;
        const start = new Date(2000, 0, 1); // Months are 0-indexed.
        const today = new Date();
        const dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
        let mSecsSinceStart = today.valueOf() - start.valueOf();
        mSecsSinceStart += ((today.getTimezoneOffset() - dstAdjust) * 60 * 1000)+60000;
        // ---
        console.log("updating")
        // get data from the BBC
        const rawRes = await fetch("https://web-cdn.api.bbci.co.uk/wc-poll-data/container/sport-olympics-medals?tournament=paris-2024").then(res => res.json())
        const res = encode(rawRes["standing"].map(x => x.rank + "!" + x.country.name + "!" + x.medals.gold + "!" + x.medals.silver + "!" + x.medals.bronze).join("!"))
        let index = 0
        if(open)
            socket.setVar("☁ Channel 1", "-1")
        const chunkSize = 256
        setTimeout(sendChunk,1000)


        function sendChunk() {
            const chunk = res.slice(index, index + chunkSize)
            if((index/chunkSize)%9 === 0) {
                if(open) {
                    socket.setVar("☁ Channel 1", (-Math.random()).toString())
                    console.log("☁ Channel 1")
                }
            }
            setTimeout(()=> {
                if (open) {

                    socket.setVar("☁ Channel " + ((index / chunkSize) % 9 + 2), chunk)
                    console.log("☁ Channel " + ((index / chunkSize) % 9 + 2))
                }
                index += chunkSize

                if (chunk.length < 256) {
                    if ((index / chunkSize) % 9 !== 0)
                        for (let i = (index / chunkSize) % 9 + 3; i < 11; i++) {
                            setTimeout(() => {
                                if (open) {
                                    socket.setVar("☁ Channel " + i, "")
                                    console.log("reset ☁ Channel " + i)
                                }
                            }, 100 * (1 + i - ((index / chunkSize) % 9 + 3)))
                        }
                    setTimeout(() => {
                        if (open) {
                            socket.setVar("☁ Channel 1", "1")
                            console.log("done")
                            setTimeout(() => {
                                if (open)
                                    socket.setVar("☁ Channel 2", (mSecsSinceStart / msPerDay).toString())
                            }, 500)
                        }
                    }, ((9 - (index / chunkSize) % 9)) * 500)
                } else {
                    setTimeout(sendChunk, 200)
                }
            }, ((index/chunkSize)%9 === 0) * 1000)
        }
    }
    socket.onOpen = () => {
        open = true
        console.log("ready")
        //Reset cloud variable and wait for a short time to prevent cloud requests overlapping
            socket.setVar("☁ Channel 1", "")
        setTimeout(() => {
            update()
            const interval = setInterval(()=> {
                    update()
            }, updateInterval)
            setInterval(()=>{
                if(!open)
                    clearInterval(interval)
            },50)

        }, 500)

    }



    socket.onClose = () => {
        open = false
        socket.connect()
        console.log("reconnecting")
    }
    socket.connect()

}

session.initialize()
console.log("initializing")
