#!/usr/bin/env node
'use strict';

var meow = require('meow');
var parseArgs = require('minimist');

var githubPages = require('../lib');
var cli = meow({
  help: '\n  Usage\n    $ github-pages [options]\n\n    Options\n    -g, --github\n    -t, --token\n    -u, --user\n    -r, --repository\n\n  Examples\n    $ github-pages -t $GH_TOKEN -u cantidio -r github-pages\n      > github-pages commit\n      > github-pages push to cantidio/github-pages\n' }, {
  alias: {
    g: 'github',
    t: 'token',
    u: 'user',
    r: 'repository'
  },
  default: {
    g: 'github.com'
  }
});

githubPages(cli.flags);