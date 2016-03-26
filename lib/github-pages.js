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
    key: 'latestCommitSHA',
    value: function latestCommitSHA() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var _config = _this.config;
        var user = _config.user;
        var repo = _config.repo;

        var ref = 'heads/master';
        var msg = { user: user, repo: repo, ref: ref };
        _this.api.gitdata.getReference(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            _this._commitSHA = data.object.sha;
            resolve(data.object.sha);
          }
        });
      });
    }
  }, {
    key: 'latestTreeSHA',
    value: function latestTreeSHA() {
      var _this2 = this;

      return this.latestCommitSHA().then(function (sha) {
        var _config2 = _this2.config;
        var user = _config2.user;
        var repo = _config2.repo;

        var msg = { user: user, repo: repo, sha: sha };
        return new Promise(function (resolve, reject) {
          _this2.api.gitdata.getCommit(msg, function (err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data.tree.sha);
            }
          });
        });
      });
    }

    //TODO remove this.

  }, {
    key: 'getTree',
    value: function getTree(sha) {
      var _this3 = this;

      var _config3 = this.config;
      var user = _config3.user;
      var repo = _config3.repo;

      var msg = { user: user, repo: repo, sha: sha, recursive: true };
      return new Promise(function (resolve, reject) {
        _this3.api.gitdata.getTree(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.tree);
          }
        });
      });
    }
  }, {
    key: 'listFolderFiles',
    value: function listFolderFiles() {
      var src = this.config.src;


      return list([src], { recurse: true, flatten: true }).then(function (files) {
        // files.shift(); //remove root data
        return files.filter(function (file) {
          return !file.mode.dir;
        }).map(function (file) {
          var mode = file.mode.exec ? '100755' : '100644';
          var type = 'blob';

          return {
            fullPath: file.path,
            path: relativePath(src, file.path),
            mode: mode,
            type: type
          };
        });
      });
    }

    //TODO remove this

  }, {
    key: 'getTreeDiff',
    value: function getTreeDiff(sha) {
      return Promise.all([this.getTree(sha), this.listFolderFiles()]).then(function (result) {
        // const treeGit = result[0];
        var treeLocal = result[1];

        return treeLocal.filter(function (file) {
          return file.type !== 'tree';
        }).map(function (fileLocal) {
          // const fileGit = treeGit.filter((fileGit)=>fileGit.path === fileLocal.path)[0];

          return {
            fullPath: fileLocal.fullPath,
            path: fileLocal.path,
            type: fileLocal.type,
            mode: fileLocal.mode,
            encoding: encoding
          };
        });
      });
    }
  }, {
    key: 'createBlob',
    value: function createBlob(filePath) {
      var _this4 = this;

      var _config4 = this.config;
      var user = _config4.user;
      var repo = _config4.repo;

      var msg = {
        user: user,
        repo: repo,
        encoding: encoding,
        content: new Buffer(fs.readFileSync(filePath)).toString(encoding)
      };

      return new Promise(function (resolve, reject) {
        _this4.api.gitdata.createBlob(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.sha);
          }
        });
      });
    }
  }, {
    key: 'createBlobs',
    value: function createBlobs(files) {
      var _this5 = this;

      return Promise.all(files.map(function (file) {
        return _this5.createBlob(file.fullPath).then(function (sha) {
          return _extends({}, file, { sha: sha });
        });
      }));
    }
  }, {
    key: 'createTree',
    value: function createTree(tree, sha) {
      var _this6 = this;

      var _config5 = this.config;
      var user = _config5.user;
      var repo = _config5.repo;

      var msg = { user: user, repo: repo, tree: tree };
      return new Promise(function (resolve, reject) {
        _this6.api.gitdata.createTree(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.sha);
          }
        });
      });
    }
  }, {
    key: 'createCommit',
    value: function createCommit(tree) {
      var _this7 = this;

      var _config6 = this.config;
      var user = _config6.user;
      var repo = _config6.repo;

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
      return new Promise(function (resolve, reject) {
        _this7.api.gitdata.createCommit(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data.sha);
          }
        });
      });
    }
  }, {
    key: 'createRef',
    value: function createRef(sha) {
      var _this8 = this;

      var _config7 = this.config;
      var user = _config7.user;
      var repo = _config7.repo;

      var msg = { user: user, repo: repo, sha: sha, ref: 'heads/master' };
      return new Promise(function (resolve, reject) {
        _this8.api.gitdata.updateReference(msg, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this9 = this;

      this.auth();
      this.latestTreeSHA().then(function (sha) {
        return _this9.getTreeDiff(sha).then(function (tree) {
          return _this9.createBlobs(tree);
        }).then(function (tree) {
          return _this9.createTree(tree, sha);
        }).then(function (sha) {
          return _this9.createCommit(sha);
        }).then(function (sha) {
          return _this9.createRef(sha);
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