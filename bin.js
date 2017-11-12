#!/usr/bin/env node
'use strict';

// TODO
// - auto prefix http:// if needed
// - rename to fetch-cli

// node index.js http://httpbin.org/ip

// for easy debug
process.on('unhandledRejection', r => console.log(r));

const fetch = require('node-fetch');
const chalk = require('chalk');
const prog = require('commander');
const fs = require('fs');
const pkg = require('./package.json');
const { spawn } = require('child_process');

const { Request, Headers } = fetch;

const state = {
  hasJq: false,
  likelyContentType: null,
  tmpFile: '/tmp/fetch-' + new Date().valueOf()
};

const headersObj = {};

/**
 * v is like "User-Agent: yoyo"
 */
function collectHeaders(v) {
  let arr = [];
  try {
    arr = v.split(':').map(x => x.trim());
  } catch (err) {}

  if (arr.length === 2) {
    headersObj[arr[0]] = arr[1];
  }
}

function parseContentType(v) {
  if (v !== '') headersObj['Content-Type'] = v.trim();
}

function parseMethod(v) {
  return v.toUpperCase();
}

function parseData(d) {
  // TODO d is "@a/b/c.json"
  if (/^[\s]*?(\{|\[[\s]*?{)/.test(d)) {
    // this shouldb a json
    state.likelyContentType = 'application/json';
  }
  return d;
}

prog
  .version(pkg.version)
  .usage('[options] url')
  .option('-X, --method <method>', 'method of this HTTP request', parseMethod)
  .option('-d, --data <data>', 'request body payload', parseData)
  .option(
    '-c, --content-type <mime type name>',
    'set Content-Type header',
    parseContentType
  )
  .option(
    '-H, --headers [header1, header2, ...]',
    'set other headers',
    collectHeaders
  )
  .option('--jq <jq selector>', 'select JSON output with stedolan/jq')
  .parse(process.argv);

const { method = 'GET', data: reqBodyData } = prog;

const url = prog.args[0];
if (!url) {
  console.log('\n  ' + chalk.red('Error: url is needed'));
  prog.help();
  process.exit(1);
}

const typePats = {
  json: /json$|json;/,
  text: /^text/
};
const patHeaderName = /(^[a-z])|-([a-z])/g;

function jsonStr(j) {
  return JSON.stringify(j, null, 2);
}

async function checkEnvHasJq() {
  const tmp = spawn('which', ['jq']);
  tmp.on('close', code => {
    return (state.hasJq = code === 0);
  });
}

/**
 * content-type => Content-Type
 */
function prettyPrintHeaderName(n) {
  return n.replace(patHeaderName, x => x.toUpperCase());
}

async function main() {
  if (!headersObj['Content-Type']) {
    headersObj['Content-Type'] = state.likelyContentType;
  }
  const headers = new Headers(headersObj);
  // https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
  const init = { method, headers };
  if (reqBodyData) {
    init.body = reqBodyData;
  }

  const req = new Request(url, init);

  const res = await fetch(req);
  // @see https://github.com/bitinn/node-fetch/blob/master/src/body.js#L357-L385
  const resContentType = res.headers.get('content-type');

  const { status, statusText } = res;

  let statusColorKey;
  if (status > 399) {
    statusColorKey = 'red';
  } else if (status > 299) {
    statusColorKey = 'yellow';
  } else {
    statusColorKey = 'green';
  }

  console.log(`${chalk[statusColorKey](status)} ${chalk.cyan(statusText)}`);

  const resContentLength = res.headers.get('content-length');

  let resHeaderStr = '';
  const rawHeaders = res.headers.raw();
  for (let h in rawHeaders) {
    const headerName = prettyPrintHeaderName(h);
    const headerVals = rawHeaders[h];
    headerVals.forEach(v => {
      const tmp = chalk.gray(headerName + ': ');
      resHeaderStr += tmp + chalk.blue(v) + '\n';
    });
  }

  console.log(resHeaderStr);

  let data;

  if (typePats.json.test(resContentType)) {
    if (state.hasJq) {
      const selector = prog.jq ? prog.jq : '.';
      const jq = spawn('jq', ['-C', selector]);
      jq.stdout.on('data', data => {
        // actuall print
        console.log(`${data}`);
      });

      jq.stderr.on('data', data => {});

      jq.on('close', code => {});

      res.body.pipe(jq.stdin).on('error', err => {
        console.log(err);
      });
    } else {
      data = await res.json();
      const tmp = jsonStr(data);
      console.log(tmp);
    }
  } else if (typePats.text.test(resContentType)) {
    const clength = Number(resContentLength);
    const isWriteToTmp = clength > 8000;
    let ws = isWriteToTmp
      ? fs.createWriteStream(state.tmpFile)
      : process.stdout;
    res.body.pipe(ws);
    if (isWriteToTmp)
      console.log(`${chalk.green('Body')} stored in: ${state.tmpFile}`);
  }
}

checkEnvHasJq();
main();
