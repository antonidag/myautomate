import puppeteer from 'puppeteer';
import 'dotenv/config'
import fs from 'fs'
import shell from 'shelljs';

(async () => {
    const environment = new String(process.env.ENVIRONMENT)

    // Git clone 
    if (!shell.which('git')) {
        shell.echo('Sorry, this script requires git');
        shell.exit(1);
    }
    shell.cd('out').exec('git clone https://github.com/antonidag/myblog.git')
    shell.cd('..')
    // Get all files from posts folder
    const filePaths = shell.find('./out/myblog/content/en/posts')
    const markdownPosts = [];
    for (const filepath of filePaths) {
        if (filepath.endsWith('.md')) {
            markdownPosts.push(filepath);
        }
    }

    // Check if it should be posted
    const notDraftPosts = [];
    for (const filePath of markdownPosts) {
        const file = fs.readFileSync(filePath).toString();
        if (file.includes('draft: false')) {
            notDraftPosts.push({ file, filePath })
        }
    }
    // Check if date time is within this hour
    const postToPublish = []
    for (const item of notDraftPosts) {
        const markdownConfig = item.file.split('---')
        var configRows = markdownConfig[1].split('\r\n')

        var pattern = /:(.*)$/
        var date = configRows[2].match(pattern)[1].trim()


        if (true) {
            var title = configRows[1].match(pattern)[1].trim().replaceAll('"', "")
            var description = configRows[4].match(pattern)[1].trim()
            var url = 'antonidag.github.io/myblog/' + item.filePath
            postToPublish.push({ title, description, url })
            console.log({ title, date, description })
        }
    }

    // Launch the browser and open a new blank page
    const password = new String(process.env.BUY_ME_COFFEE_PASSWORD)
    const username = new String(process.env.BUY_ME_COFFEE_USERNAME)
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate the page to a URL
    await page.goto('https://www.buymeacoffee.com/app/login/');

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    // Login user
    await page.type('#login-email', username);
    const loginBtbSelector = '#login-btn'
    await page.click(loginBtbSelector);
    console.log('Waiting 5 sec')
    await delay(5000)
    console.log('Writing in password')
    await page.type('#login-password', password)
    await page.click(loginBtbSelector)

    // Go to new post


    // // create function for this below
    // // Write new post
    for (const item of postToPublish) {
        console.log('Waiting 5 sec before we go to new posts')
        await delay(10000)
        await page.goto('https://www.buymeacoffee.com/app/posts/new');
        await page.type('#post-title', item.title)
        await page.click('.editor__content')

        var breadText = item.description +
            '\n' +
            'Check out the full post at: ' + item.url

        await page.keyboard.type(breadText)
        if (environment == 'PROD') {
            // // Publish post
            await page.click('#publish-now');
        }

    }

    await browser.close();
})();


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}