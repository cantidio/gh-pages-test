'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var pkgConf = require('pkg-conf');

var defaultCfg = {
  api: {
    version: '3.0.0',
    protocol: 'https',
    host: 'api.github.com',
    pathPrefix: '',
    timeout: 5000
  }
};

function splitRepoSlug(repoSlug) {
  if (repoSlug) {
    var slug = repoSlug.split('/');
    return {
      user: slug[0],
      repo: slug[1]
    };
  }

  return {};
}

function flagsToCfg(flags, src) {
  var _splitRepoSlug = splitRepoSlug(flags.repo);

  var user = _splitRepoSlug.user;
  var repo = _splitRepoSlug.repo;

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
    user: user,
    repo: repo,
    src: src && src.length > 0 ? src : undefined
  };
}

function mergeObjects() {
  for (var _len = arguments.length, objs = Array(_len), _key = 0; _key < _len; _key++) {
    objs[_key] = arguments[_key];
  }

  return objs.filter(function (obj) {
    return obj !== undefined;
  }).reduce(function (a, b) {
    var obj = _extends({}, a);
    var keys = Object.keys(b).filter(function (k) {
      return b[k] !== undefined;
    });
    keys.forEach(function (k) {
      return obj[k] = b[k];
    });
    return obj;
  }, {});
}

module.exports = function (flags, src) {
  var fileCfg = pkgConf.sync('github-pages');
  var cliCfg = flagsToCfg(flags, src);
  var cfg = {
    api: mergeObjects(defaultCfg.api, fileCfg.api, cliCfg.api),
    auth: mergeObjects(fileCfg.auth, cliCfg.auth),
    user: cliCfg.user || fileCfg.user,
    repo: cliCfg.repo || fileCfg.repo,
    src: cliCfg.src || fileCfg.src
  };

  if (!(cfg.repo && cfg.user && cfg.auth && cfg.auth.token && cfg.src && cfg.src.length > 0)) {
    return null;
  }

  return cfg;
};