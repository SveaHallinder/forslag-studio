import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {homedir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),runtime=path.join(root,'.sites-runtime'),config=path.join(runtime,'browser-agent.json');
if(process.platform!=='darwin')throw new Error('[browser agent] Automatic login startup is available on macOS. Use npm run browser:agent on this host.');
await readFile(config);await chmod(config,0o600);await mkdir(runtime,{recursive:true});
const label='com.forslagstudio.browser-agent',folder=path.join(homedir(),'Library/LaunchAgents'),filename=path.join(folder,label+'.plist');
const xml=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plist=`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array>${[process.execPath,path.join(root,'scripts/browser-agent.mjs'),config].map(value=>'<string>'+xml(value)+'</string>').join('')}</array><key>WorkingDirectory</key><string>${xml(root)}</string><key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>30</integer><key>StandardOutPath</key><string>${xml(path.join(runtime,'browser-agent.log'))}</string><key>StandardErrorPath</key><string>${xml(path.join(runtime,'browser-agent.log'))}</string></dict></plist>`;
let old;try{old=await readFile(filename,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
if(old&&!old.includes(path.join(root,'scripts/browser-agent.mjs'))&&!old.includes(xml(path.join(root,'scripts/browser-agent.mjs'))))throw new Error('[browser agent] Another installation owns this launch agent. Do not overwrite it.');
await mkdir(folder,{recursive:true});await writeFile(filename,plist,{mode:0o600});
const domain='gui/'+process.getuid();try{execFileSync('launchctl',['bootout',domain+'/'+label],{stdio:'ignore'});}catch{}
execFileSync('launchctl',['bootstrap',domain,filename],{stdio:'pipe'});
console.info('[browser agent] Mac login startup installed. Configuration stays in the ignored private runtime folder.');
