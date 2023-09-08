import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

const fs = require('fs');

var envVariables: any = {
    creds: {
        "username": "ben+pose@workwithloop.com",
        "password": "Password123"
    },
    files: {
        "testFile": "./testCases.json"
    }
}

var locators: any = {
    login: {
        "pageURL": "https://app.asana.com/-/login",
        "inputEmail": ".LoginEmailForm-emailInput",
        "buttonEmailContinue": ".LoginEmailForm-continueButton",
        "inputPassword": ".LoginPasswordForm-passwordInput",
        "buttonPasswordLogin": ".LoginPasswordForm-loginButton"
    },
    dashboard: {
        "topbarAvatarElement": ".TopbarSettingsMenuButton-avatar",
        "topbarAvatarDropdownIcon": ".MiniIcon.ArrowDownMiniIcon",
        "topbarDropdownLogoutButton": ".TopbarSettingsMenu-logout"
    },
    kanbanBoard: {
        //"breadcrumbIcons": ".TopbarPageHeaderStructureWithBreadcrumbs-icons",
        "boardColumn": ".BoardColumn",
        "boardCard": ".BoardCardLayout",
        "cardTags": ".BoardCardCustomPropertiesAndTags-cellWrapper"
    }
}

var commonFunctions: any = {
    async performLogin(page: Page) {
        await page.fill(locators.login.inputEmail, envVariables.creds.username);
        await page.click(locators.login.buttonEmailContinue);
        await page.fill(locators.login.inputPassword, envVariables.creds.password);
        await page.click(locators.login.buttonPasswordLogin);

        const element = page.locator(locators.dashboard.topbarAvatarElement);
        await element.waitFor({state: "visible", timeout: 60 * 1000}); // 30 seconds wait to load the page
    },
    async performLogout(page: Page) {
        await page.click(locators.dashboard.topbarAvatarDropdownIcon)
        await page.click(locators.dashboard.topbarDropdownLogoutButton)

        const element = page.locator(locators.login.inputEmail);
        await element.waitFor({state: "visible", timeout: 60 * 1000}); // 15 seconds wait to load the page
    }
}

let fileData = fs.readFileSync(envVariables.files.testFile, "utf-8");
let testCases = JSON.parse(fileData);
for (const data of testCases) {
  test(`${data.name} , id: ${data.id}`, async ({ page }) => {

    await test.step("navigate to site and correct leftnav item.", async () => {
        await page.goto(locators.login.pageURL);
        await commonFunctions.performLogin(page);
        await page.getByLabel(data.leftNav).click()
    })

    await test.step("Identify the correct column and the card within.", async () => {
        console.log("\t- Navigated to the correct left nav item: " + data.leftNav)

        // await page.locator(locators.kanbanBoard.breadcrumbIcons).waitFor({state: "visible", timeout: 60 * 1000}); // wait for the page to load

        const column = await page.locator(locators.kanbanBoard.boardColumn, {has: page.getByText(data.column)})
        console.log("\t- Identified the correct column by matching title to: " + data.column)

        const cardTitle = await column.getByText(data.card_title); // Getting the card title from the same coulmn we identified above.
        await expect(cardTitle).toHaveCount(1); //verify that we have 1 and only 1 card.
        console.log("\t- Verified the card title exists in the identified column: " + data.column + ", Card title: " + data.card_title);

        const singleCard = await column.locator(locators.kanbanBoard.boardCard, {has: page.getByText(data.card_title)})
        console.log("\t- Identified the single card element which has title: " + data.card_title);

        await test.step("retreive and verify desired tags.", async () => {
            const retrievedTags = await singleCard.locator(locators.kanbanBoard.cardTags).allInnerTexts()
            console.log("\t- Reterived tags for the identified card. Tags are: " + JSON.stringify(retrievedTags));
    
            await expect(data.tags.sort()).toEqual(retrievedTags.sort())
            console.log("\t- Verified expected tags match with reterived tags trom the card.")
        })
    })
    
    await commonFunctions.performLogout(page)
    console.log("\t- Logout of user.")
  });
}
