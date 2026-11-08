import { spawn } from 'node:child_process'
const children = ['server.mjs','node_modules/vite/bin/vite.js'].map(file => spawn(process.execPath,[file],{stdio:'inherit'}))
let stopping = false
function stop(code = 0) {if(stopping)return;stopping=true;children.forEach(child=>child.kill());process.exitCode=code}
children.forEach(child=>{child.on('error',()=>stop(1));child.on('exit',code=>stop(code || 0))})
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop())
