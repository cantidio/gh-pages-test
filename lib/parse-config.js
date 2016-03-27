'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var pkgConf = require('pkg-conf');
var objectMerge = require('./object-merge');

var defaultCfg = {
  api: {
    version: '3.0.0',
    protocol: 'https',
    host: 'api.github.com',
    pathPrefix: '',
    timeout: 5000
  },
  auth: {
    type: 'token',
    token: process.env.GH_TOKEN
  },
  remote: {
    ref: 'heads/gh-pages'
  },
  commit: {
    message: 'github-pages publish.'
  }
};

function parseRepo(repoSlug) {
  var slug = (repoSlug || '').split('/');

  var _slug = _slicedToArray(slug, 2);

  var user = _slug[0];
  var repo = _slug[1];

  return {
    user: user,
    repo: repo
  };
}

function parseAuthor(author) {
  var emailExp = /^.*<(.+)>.*$/;
  var nameExp = /^(.*\S).*<.*$/;

  try {
    return {
      name: nameExp.exec(author)[1],
      email: emailExp.exec(author)[1]
    };
  } catch (e) {
    return undefined;
  }
}

function flagsToCfg(flags, src) {
  return {
    api: {
      version: flags.apiVersion,
      protocol: flags.apiProtocol,
      host: flags.apiHost,
      pathPrefix: flags.apiPath,
      timeout: flags.apiTimeout
    },
    auth: {
      type: flags.token ? 'token' : undefined,
      token: flags.token
    },
    commit: {
      message: flags.commitMessage,
      author: flags.commitAuthor
    },
    remote: {
      repo: flags.repo,
      ref: flags.remoteRef
    },
    src: src && src.length > 0 ? src : undefined
  };
}

function normalizeConfig(config) {
  var remote = config.remote;
  var commit = config.commit;

  if (remote && remote.repo) {
    _extends(remote, parseRepo(remote.repo));
  }

  if (commit && commit.author) {
    commit.author = parseAuthor(commit.author);
  }

  return _extends({}, config, { remote: remote, commit: commit });
}

function isConfigValid(config) {
  var _ref = config || {};

  var remote = _ref.remote;
  var auth = _ref.auth;
  var src = _ref.src;

  return remote && remote.repo && remote.user && auth && auth.type && auth.token && src && src.length > 0;
}

module.exports = function (flags, src) {
  var fileCfg = pkgConf.sync('github-pages');
  var cliCfg = flagsToCfg(flags, src);
  var config = normalizeConfig(objectMerge(defaultCfg, fileCfg, cliCfg));

  if (!isConfigValid(config)) {
    return null;
  }

  return config;
};