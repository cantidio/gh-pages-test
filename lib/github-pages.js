'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var relativePath = require('path').relative;
var GitHubApi = require('github');
var list = require('ls-all');
var fs = require('fs');
var encoding = 'base64';

module.exports = function () {
  function GithubPages(config) {
    _classCallCheck(this, GithubPages);

    this.config = config;
    this.api = new GitHubApi(this.config.api);
  }

  _createClass(GithubPages, [{
    key: 'auth',
    value: function auth() {
      this.api.authenticate(this.config.auth);
    }
  }, {
    key: 'execMethod',
    value: function execMethod(msg, method, extract) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        method(_this.api)(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            var res = extract ? extract(data) : data;
            resolve(res);
          }
        });
      });
    }
  }, {
    key: 'latestCommitSHA',
    value: function latestCommitSHA() {
      var _this2 = this;

      var _config = this.config;
      var user = _config.user;
      var repo = _config.repo;

      var ref = 'heads/master';
      var msg = { user: user, repo: repo, ref: ref };

      return this.execMethod(msg, function (api) {
        return api.gitdata.getReference;
      }, function (res) {
        _this2._commitSHA = res.object.sha;
        return res.object.sha;
      });
    }
  }, {
    key: 'latestTreeSHA',
    value: function latestTreeSHA() {
      var _this3 = this;

      return this.latestCommitSHA().then(function (sha) {
        var _config2 = _this3.config;
        var user = _config2.user;
        var repo = _config2.repo;

        var msg = { user: user, repo: repo, sha: sha };
        return _this3.execMethod(msg, function (api) {
          return api.gitdata.getCommit;
        }, function (res) {
          return res.tree.sha;
        });
      });
    }
  }, {
    key: 'listFolderFiles',
    value: function listFolderFiles() {
      var src = this.config.src;


      return list([src], { recurse: true, flatten: true }).then(function (files) {
        return files.filter(function (file) {
          return !file.mode.dir;
        }).map(function (file) {
          var mode = file.mode.exec ? '100755' : '100644';
          var type = 'blob';

          return {
            fullPath: file.path,
            path: relativePath(src, file.path),
            mode: mode,
            type: type,
            encoding: encoding
          };
        });
      });
    }
  }, {
    key: 'readFile',
    value: function readFile(filePath) {
      return new Buffer(fs.readFileSync(filePath)).toString(encoding);
    }
  }, {
    key: 'createBlob',
    value: function createBlob(filePath) {
      var _config3 = this.config;
      var user = _config3.user;
      var repo = _config3.repo;

      var msg = { user: user, repo: repo, encoding: encoding, content: this.readFile(filePath) };
      return this.execMethod(msg, function (api) {
        return api.gitdata.createBlob;
      }, function (res) {
        return res.sha;
      });
    }
  }, {
    key: 'createBlobs',
    value: function createBlobs(files) {
      var _this4 = this;

      return Promise.all(files.map(function (file) {
        return _this4.createBlob(file.fullPath).then(function (sha) {
          return _extends({}, file, { sha: sha });
        });
      }));
    }
  }, {
    key: 'createTree',
    value: function createTree(tree, sha) {
      var _config4 = this.config;
      var user = _config4.user;
      var repo = _config4.repo;

      var msg = { user: user, repo: repo, tree: tree };

      return this.execMethod(msg, function (api) {
        return api.gitdata.createTree;
      }, function (res) {
        return res.sha;
      });
    }
  }, {
    key: 'createCommit',
    value: function createCommit(tree) {
      //TODO pass this._commitSHA as a param
      var _config5 = this.config;
      var user = _config5.user;
      var repo = _config5.repo;

      var msg = {
        user: user,
        repo: repo,
        message: 'Commit from github-pages',
        author: {
          name: 'cantidio fontes',
          email: 'aniquilatorbloody@gmail.com'
        },
        parents: [this._commitSHA],
        tree: tree
      };
      return this.execMethod(msg, function (api) {
        return api.gitdata.createCommit;
      }, function (res) {
        return res.sha;
      });
    }
  }, {
    key: 'createRef',
    value: function createRef(sha) {
      var _config6 = this.config;
      var user = _config6.user;
      var repo = _config6.repo;

      var msg = { user: user, repo: repo, sha: sha, ref: 'heads/master' };
      return this.execMethod(msg, function (api) {
        return api.gitdata.updateReference;
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this5 = this;

      this.auth();
      this.latestTreeSHA().then(function (sha) {
        return _this5.listFolderFiles().then(function (tree) {
          return _this5.createBlobs(tree);
        }).then(function (tree) {
          return _this5.createTree(tree, sha);
        }).then(function (sha) {
          return _this5.createCommit(sha);
        }).then(function (sha) {
          return _this5.createRef(sha);
        });
      }).then(function (data) {
        console.log(JSON.stringify(data, null, 2));
      }).catch(function (err) {
        console.log(err);
      });
    }
  }]);

  return GithubPages;
}();