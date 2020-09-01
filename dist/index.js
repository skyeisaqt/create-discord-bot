#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const child_process_1 = require("child_process");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const prompts_1 = __importDefault(require("prompts"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const appDirectory = path_1.default.join(__dirname, "../app");
const appPackage = require(path_1.default.join(appDirectory, "package.json"));
const utilityPackage = require(path_1.default.join(__dirname, "../package.json"));
const utilityNameAndVersion = `${utilityPackage.name} v${utilityPackage.version}`;
console.log(`This utility will walk you through creating a ${utilityPackage.name} application.

Press ENTER to use the default.
Press ^C at any time to quit.

${utilityNameAndVersion}`);
const questions = [
    {
        type: "text",
        name: "name",
        initial: appPackage.name,
        validate: (name) => {
            const { validForNewPackages, errors, warnings } = validate_npm_package_name_1.default(name);
            return (validForNewPackages || `Error: ${(errors || warnings).join(", ")}.`);
        },
        message: "Application name?",
    },
    {
        type: "password",
        name: "token",
        initial: "DISCORD_BOT_TOKEN_PLACEHOLDER",
        message: "Discord bot token?",
    },
];
prompts_1.default(questions)
    .then(async (answers) => {
    console.log();
    const { name, token } = answers;
    const directory = path_1.default.resolve(name);
    const updateSteps = [
        {
            message: `Updating core files in '${name}'...`,
            action: () => {
                fs_extra_1.default.copySync(`${appDirectory}/src/core`, `${directory}/src/core`);
                fs_extra_1.default.copySync(`${appDirectory}/src/index.js`, `${directory}/src/index.js`);
            },
        },
    ];
    const cleanInstallSteps = [
        {
            message: `Creating directory '${name}'...`,
            action: () => fs_extra_1.default.mkdirSync(directory),
        },
        {
            message: "Creating boilerplate...",
            action: () => {
                fs_extra_1.default.copySync(appDirectory, directory);
                const gitIgnore = "node_modules/\ntoken.json\n";
                fs_extra_1.default.writeFileSync(path_1.default.join(directory, ".gitignore"), gitIgnore);
            },
        },
        {
            message: "Updating package.json...",
            action: () => {
                const description = `Generated by ${utilityNameAndVersion}.`;
                const newPackage = { ...appPackage, name, description };
                fs_extra_1.default.writeFileSync(path_1.default.join(directory, "package.json"), `${JSON.stringify(newPackage, null, 2)}\n`);
            },
        },
        {
            message: "Writing token.json...",
            action: () => {
                const newToken = { token };
                fs_extra_1.default.writeFileSync(path_1.default.join(directory, "token.json"), `${JSON.stringify(newToken, null, 2)}\n`);
            },
        },
        {
            message: "Installing modules...",
            action: () => {
                process.chdir(directory);
                child_process_1.execSync("npm ci --loglevel=error");
            },
        },
    ];
    const isUpdate = fs_extra_1.default.existsSync(directory);
    let steps;
    if (isUpdate) {
        const updateAnswer = await prompts_1.default([
            {
                type: "confirm",
                name: "update",
                message: `Directory '${directory}' already exists. Do you want to update it?`,
            },
        ]);
        console.log();
        if (!updateAnswer.update) {
            throw `Error: '${directory}' already exists.\nQuitting...`;
        }
        steps = updateSteps;
    }
    else {
        steps = cleanInstallSteps;
    }
    const [, , ...args] = process.argv;
    const isDryRun = args[0] === "--dry-run";
    steps.forEach(({ message, action }) => {
        console.log(message);
        if (!isDryRun) {
            action();
        }
    });
    if (!isUpdate) {
        console.log();
        console.log("Generating bot invite link...");
        const client = new discord_js_1.Client();
        await client
            .login(token)
            .then(() => console.log(`Invite your bot: https://discordapp.com/oauth2/authorize?scope=bot&client_id=${client.user.id}`))
            .catch(() => console.warn("Bot invite link was not generated due to the given bot token being invalid."));
        console.log();
    }
    console.log(`Done!\n\nStart by running:\n\t$ cd ${name}/\n\t$ npm start`);
    process.exit(0);
})
    .catch(console.error);
