#!/usr/bin/env node
'use strict';

var meow = require('meow');
var parseConfig = require('../lib/parse-config');
var GithubPages = require('../lib');
var cli = meow({
  help: '\n  Usage\n    $ github-pages [options] [src]\n\n    Options\n    -r, --repository\n    -t, --token\n        --api-version\n        --api-protocol\n        --api-host\n        --api-path\n        --api-timeout\n\n  Examples\n    $ github-pages -r cantidio/github-pages -t $GH_TOKEN ./data\n      > github-pages commit\n      > github-pages push to cantidio/github-pages\n' }, {
  alias: {
    r: 'repo',
    t: 'token'
  }
});

var cfg = parseConfig(cli.flags, cli.input[0]);
if (!cfg) {
  console.log('provide the user, repo and token.');
  console.log(cli.help);
  process.exit(1);
}

var ghpages = new GithubPages(cfg);
ghpages.run();