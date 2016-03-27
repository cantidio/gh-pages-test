#!/usr/bin/env node
'use strict';

var meow = require('meow');
var parseConfig = require('../lib/parse-config');
var GithubPages = require('../lib');

var cli = meow({
  help: '\n  Usage\n    $ github-pages [options] [src]\n\n    Options\n    -r, --repository\n    -t, --token\n    -m  --commit-message\n    -a  --commit-author\n        --remote-ref\n        --api-version\n        --api-protocol\n        --api-host\n        --api-path\n        --api-timeout\n\n  Examples\n    $ github-pages -r cantidio/node-github-pages -t $GH_TOKEN ./data\n      > github-pages commit\n      > github-pages push to cantidio/node-github-pages\n' }, {
  alias: {
    r: 'repo',
    t: 'token',
    m: 'commit-message',
    a: 'commit-author'
  }
});

var config = parseConfig(cli.flags, cli.input[0]);

if (!config) {
  console.log('provide the user, repo and token.');
  console.log(cli.help);
  process.exit(1);
}

var ghpages = new GithubPages(config);

console.log('GithubPages:run.');
console.log('GithubPages:publish ' + config.remote.ref);
ghpages.publish().then(function (res) {
  console.log('GithubPages:done');
}).catch(function (err) {
  console.error('GithubPages:error updating remote ref.');
  process.exit(1);
});